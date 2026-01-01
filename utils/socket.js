// src/socket/socket.js
import { Server } from 'socket.io'
import {
    startSession,
    checkSession,
    deleteSession,
    restoreSessions,
    getActiveSocket
} from './waManager.js'
import { createLogger } from '../src/logger.js'
import {
    getSessionBy
} from '../models/WaSession.js'
import { waRuntime } from './waRuntime.js'
export const initializeSocket = (server) => {
    const io = new Server(server, { cors: { origin: '*' } })

    io.on('connection', (socket) => {
        const logger = createLogger(io)
        // ===== JOIN ROOM =====
        socket.on('join_wa_room', (botPhoneNumber) => {
            socket.join(`wa:${botPhoneNumber}`)
            console.log('🔗 Join room:', botPhoneNumber)
        })

        // ===== CHECK SESSION =====
        socket.on('check_session', async (botPhoneNumber) => {
            const res = await checkSession(botPhoneNumber)
            socket.emit(
                res.status === 'CONNECTED'
                    ? 'session_exists'
                    : 'session_not_exists',
                res
            )
        })

        // ===== START =====
        socket.on("wa:start", async (data) => {

            // 🔥 PENTING: pastikan tidak ada session lama
            // if (sessions.has(data.username)) {
            //     await sessions.get(data.username).ws.close()
            //     sessions.delete(data.username)
            // }
            const session = (await getSessionBy('botPhoneNumber', data.username))[0];
            await startSession({
                io,
                username: session.username,
                botPhoneNumber: data.username,
                method: data.method,
                logger
            })
        })

        socket.on('wa:check', async (botPhoneNumber) => {
            const status = await checkSession(botPhoneNumber)
            socket.emit('wa:status', status)
        })

        // ===== DELETE =====
        socket.on("delete_session", async (botPhoneNumber) => {
            await deleteSession(botPhoneNumber)
            socket.emit("session_deleted")
        })

        socket.on('check_session', async (botPhoneNumber) => {
            const dbSession = (await getSessionBy('botPhoneNumber', botPhoneNumber))[0]
            const runtime = waRuntime.sessions.get(botPhoneNumber)

            // 1️⃣ ADA SESI & MASIH CONNECTED
            if (runtime && runtime.status === 'connected' && runtime.user) {
                socket.emit('session_exists', {
                    connected: true,
                    wid: runtime.user.wid,
                    pushname: runtime.user.pushname,
                    profilePicUrl: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png',
                    actions: ['restart', 'delete']
                })
                return
            }

            // 2️⃣ ADA SESI TAPI DISCONNECTED
            if (dbSession && runtime?.status === 'disconnected') {
                socket.emit('session_exists', {
                    connected: false,
                    actions: ['restart', 'delete']
                })
                return
            }

            // 3️⃣ TIDAK ADA SESI SAMA SEKALI
            socket.emit('session_not_exists', {
                actions: ['start_qr', 'start_pairing']
            })
        })

        socket.on("cancel_pending_session", async (botPhoneNumber) => {
            await deleteSession(botPhoneNumber)
        })


        // ===== RESTART =====
        socket.on('restart_session', async (botPhoneNumber) => {
            await deleteSession(botPhoneNumber)
            await startSession({
                io,
                username: botPhoneNumber,
                botPhoneNumber,
                method: 'qr',
                logger: console
            })
        })

        socket.on("wa:send-message", async ({ username, to, message }) => {
            try {
                const sock = getActiveSocket(username)
                if (!sock) {
                    socket.emit("wa:message-failed", "WhatsApp belum terkoneksi")
                    return
                }

                const jid = to.includes("@")
                    ? to
                    : `${to}@s.whatsapp.net`

                await sock.sendMessage(jid, { text: message })

                socket.emit("wa:message-sent")
            } catch (err) {
                socket.emit("wa:message-failed", err.message)
            }
        })
        socket.on("wa:send-media", async (data) => {
            try {
                const sock = getActiveSocket(data.username)
                if (!sock) {
                    socket.emit("wa:message-failed", "WA belum aktif")
                    return
                }

                const buffer = Buffer.from(
                    data.file.split(",")[1],
                    "base64"
                )

                const jid = `${data.to}@s.whatsapp.net`

                await sock.sendMessage(jid, {
                    caption: data.caption || "",
                    mimetype: data.mimetype,
                    fileName: data.filename,
                    document: buffer
                })

                socket.emit("wa:message-sent")
            } catch (e) {
                socket.emit("wa:message-failed", e.message)
            }
        })
        socket.on("wa:update-setting", async (data) => {
            await updateSession(data.username, {
                autoRead: data.autoRead,
                typingReply: data.typingReply
            })

            socket.emit("message", "⚙️ Pengaturan disimpan")
        })


    })

    // AUTO RESTORE
    restoreSessions(io)
}
