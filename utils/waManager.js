// src/wa/waManager.js
import fs from 'fs'
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    delay
} from '@whiskeysockets/baileys'

import {
    getAllSession,
    getSession,
    updateSession
} from '../models/WaSession.js'
import handleMessage from '../src/handlers/messageHandler.js'
import { saveMessage } from '../handlers/message/messageStore.js'
import handleDelete from '../handlers/deleteHandler.js'
import handleCommand from '../handlers/commandHandler.js'
import { waRuntime } from './waRuntime.js'
// =============================
// RUNTIME MEMORY (WAJIB ADA)
// =============================
const sessions = new Map()
// key: botPhoneNumber
// val: { sock, username }

// =============================
// START / CREATE SESSION
// =============================
const restarting = new Set()
export const startSession = async ({
    io,
    username,
    botPhoneNumber,
    method = 'qr',
    logger
}) => {
    if (sessions.has(botPhoneNumber)) return

    const { state, saveCreds } =
        await useMultiFileAuthState(`./sessions/${botPhoneNumber}`)
    const room = `wa:${botPhoneNumber}`
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })

    sessions.set(botPhoneNumber, { sock, username })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update

        // ===== QR MODE =====
        if (qr && method === 'qr') {
            io.to(room).emit('wa:qr', qr)
            io.to(room).emit('message', '📸 QR generated')
        }

        // ===== PAIRING MODE =====
        if (
            method === 'pairing' &&
            connection === 'connecting' &&
            !state.creds.registered
        ) {
            await delay(3000)
            const code = await sock.requestPairingCode(botPhoneNumber)
            io.to(room).emit('wa:pairing-code', code)
            io.to(room).emit('message', `🔐 Pairing Code: ${code}`)
        }

        // ===== CONNECTED =====
        if (connection === 'open') {
            const wid = sock.user.id
            const botNumber = wid.split('@')[0]
            const pushname = sock.user.name

            await updateSession(botPhoneNumber, {
                wid,
                pushname,
                authData: state.creds,
                status: 'Connected'
            })
            waRuntime.sessions.set(botPhoneNumber, {
                sock,
                status: 'connected',
                user: { wid, pushname }
            })
            // if (botNumber === botPhoneNumber) {
            io.to(room).emit('wa:ready', {
                botPhoneNumber,
                wid: sock.user.id,
                pushname: sock.user.name
            })
            // }

            io.to(room).emit('message', `✅ WA Connected: ${botPhoneNumber}`)
        }

        // ===== DISCONNECTED =====
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode

            await updateSession(botPhoneNumber, {
                wid: null,
                pushname: null,
                authData: null,
                status: 'Disconnected'
            })
            waRuntime.sessions.set(botPhoneNumber, {
                sock,
                status: 'disconnected',
                user: null
            })
            sessions.delete(botPhoneNumber)
            io.to(room).emit('session_not_exists')
            if (
                reason !== DisconnectReason.loggedOut &&
                !restarting.has(botPhoneNumber)
            ) {
                restarting.add(botPhoneNumber)

                setTimeout(() => {
                    startSession({
                        io,
                        username,
                        botPhoneNumber,
                        method: 'qr',
                        logger
                    })
                    restarting.delete(botPhoneNumber)
                }, 5000)
            }
            io.to(room).emit('message', ` WA Dicconnected: ${reason}`)
        }

    })
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (const msg of messages) {
            await handleMessage(sock, msg, logger, io)
            saveMessage(msg)
            await handleCommand(sock, msg)
        }
    })
    sock.ev.on('messages.delete', (deleted) => {
        handleDelete(sock, deleted)
    })

    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update
            if (!id || !id.endsWith('@g.us')) return

            const groupMeta = await sock.groupMetadata(id)
            const groupName = groupMeta.subject
            const groupDesc = groupMeta.desc || 'Belum ada deskripsi grup.'

            for (const p of participants) {
                // 🔥 AMAN UNTUK SEMUA FORMAT
                const jid = typeof p === 'string' ? p : p.id
                if (!jid) continue

                const userId = jid.split('@')[0]

                if (action === 'add') {
                    await sock.sendMessage(id, {
                        text:
                            `📢 Selamat datang di *${groupName}*, @${userId}! 🎉\n\n` +
                            `📌 *Deskripsi Grup*:\n${groupDesc}`,
                        mentions: [jid]
                    })
                }

                if (action === 'remove') {
                    await sock.sendMessage(id, {
                        text: `👋 @${userId} telah meninggalkan grup. Semoga sukses! ✨`,
                        mentions: [jid]
                    })
                }
            }

        } catch (err) {
            console.error('group update error:', err)
        }
    })


}

// =============================
// CHECK SESSION (DARI SOCKET.IO)
// =============================
export const checkSession = async (botPhoneNumber) => {
    const db = await getSession({ botPhoneNumber })

    if (!db || db.waStatus !== 'Connected') {
        return { status: 'OFFLINE' }
    }

    const runtime = sessions.get(botPhoneNumber)

    if (!runtime || !runtime.sock?.user) {
        return { status: 'CONNECTING' }
    }

    return {
        status: 'CONNECTED',
        wid: runtime.sock.user.id,
        pushname: runtime.sock.user.name
    }
}

export const getActiveSocket = (botPhoneNumber) => {
    const runtime = waRuntime.sessions.get(botPhoneNumber)

    if (!runtime) return null
    if (runtime.status !== 'connected') return null
    if (!runtime.sock || !runtime.sock.user) return null

    return runtime.sock
}

// =============================
// AUTO RESTORE (SERVER START)
// =============================
export const restoreSessions = async (io, logger) => {
    const list = await getAllSession()

    for (const row of list) {
        if (row.waStatus !== 'Connected') continue

        const path = `./sessions/${row.botPhoneNumber}`
        if (!fs.existsSync(path)) {
            await updateSession(row.botPhoneNumber, { status: 'Disconnected' })
            continue
        }

        startSession({
            io,
            username: row.username,
            botPhoneNumber: row.botPhoneNumber,
            method: 'restore',
            logger
        })
    }
}

// =============================
// DELETE SESSION
// =============================
export const deleteSession = async (botPhoneNumber) => {
    const runtime = sessions.get(botPhoneNumber)

    if (runtime?.sock) {
        try {
            runtime.sock.ev.removeAllListeners()
            await runtime.sock.logout()
            runtime.sock.ws?.close()
        } catch (e) {
            console.log('Logout error ignored:', e.message)
        }
    }

    // ❗ PENTING: hapus dari SEMUA runtime
    sessions.delete(botPhoneNumber)
    waRuntime?.sessions?.delete(botPhoneNumber)
    waRuntime?.pairingSent?.delete(botPhoneNumber)

    // hapus auth folder
    fs.rmSync(`./sessions/${botPhoneNumber}`, {
        recursive: true,
        force: true
    })

    // update DB
    await updateSession(botPhoneNumber, {
        wid: null,
        pushname: null,
        authData: null,
        status: 'Disconnected'
    })

    console.log(`🧹 Session ${botPhoneNumber} wiped clean`)
}

