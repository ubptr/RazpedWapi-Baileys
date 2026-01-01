import autoReply from './autoReply.js'
import sendWebhook from './webhook.js'
import { delay } from "@whiskeysockets/baileys"
const adminUsers = ['6285186881840', '6289876543210']; // Daftar admin
import { getSession } from '../../models/WaSession.js'

const getUserRole = (number) => {
    return adminUsers.includes(number) ? 'admin' : 'user'
}
const getBotNumber = (sock) => {
    if (!sock?.user?.id) return null
    return sock.user.id.split("@")[0]
}

const BOT_START_TIME = Date.now()
function formatRuntime(ms) {
    const sec = Math.floor(ms / 1000)
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h} jam ${m} menit ${s} detik`
}

async function isGroupAdmin(sock, jid, userJid) {
    const metadata = await sock.groupMetadata(jid)
    return metadata.participants.some(
        p => p.id === userJid && (p.admin === 'admin' || p.admin === 'superadmin')
    )
}

async function getGroupAdmins(sock, jid) {
    const metadata = await sock.groupMetadata(jid)
    return metadata.participants
        .filter(p => p.admin)
        .map(p => p.id)
}


// Fungsi untuk menangani pesan dengan Baileys
export default async function handleMessage(sock, msg, logger, io) {
    try {
        if (!msg.message) return
        if (msg.key.fromMe) return
        // const botPhoneNumber = getBotNumber(sock)
        // if (!botPhoneNumber) return
        // const session = await getSession({ botPhoneNumber })
        // if (!session) return
        const jid = msg.key.remoteJid
        const reply = (jid, text) => {
            return sock.sendMessage(jid, { text }, { quoted: msg })
        }

        // Abaikan status & broadcast
        if (jid === 'status@broadcast' || jid.endsWith('@broadcast')) return

        // Ambil teks pesan dengan aman
        const text = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            ''

        if (!text) return

        console.log('message', `Message from ${jid}: ${text}`)

        // ===== AUTO REPLY CONTOH =====
        if (text.toLowerCase() === 'ping') {
            await reply(jid, 'pong 🏓')
        }


        if (text.toLowerCase() === 'halo') {
            await reply(jid, 'Halo 👋\nIni bot Razped WA Gateway')
        }

        if (text.toLowerCase() === '!runtime') {
            const runtime = formatRuntime(Date.now() - BOT_START_TIME)
            await reply(jid, `⏱ Runtime Bot:\n\n${runtime}`)
        }
        if (text.toLowerCase() === '!menu') {
            const menuText = `
📌 *MENU RAZPED WA BOT*

🔹 *UMUM*
1️⃣ !ping — Cek respon bot
2️⃣ !runtime — Lama bot berjalan
3️⃣ !info — Informasi bot
4️⃣ !owner — Kontak owner
5️⃣ !cek — Cek status bot

🔹 *GRUP*
6️⃣ !gid — Tampilkan ID grup
7️⃣ !info-group — Info detail grup
8️⃣ !admin — List admin grup
9️⃣ !tag <teks> — Tag semua member

🔹 *ADMIN GRUP*
🔒 !lock — Kunci grup
🔓 !unlock — Buka grup
➕ !add <nomor> — Tambah member
➖ !kick @user — Keluarkan member
🔗 !linkgrup — Ambil link grup

━━━━━━━━━━━━━━
🤖 Razped WA Gateway
`
            await reply(jid, menuText)
        }

        if (text.toLowerCase() === '!owner') {
            const ownerNumber = '6285186881840' // TANPA +, TANPA @c.us
            const ownerName = 'Ulung Briansyah Putra (Owner)'

            const vcard =
                `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:Razped WA Gateway
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD`

            await sock.sendMessage(jid, {
                contacts: {
                    displayName: ownerName,
                    contacts: [
                        {
                            vcard
                        }
                    ]
                }
            })
        }

        if (text.toLowerCase() === '!linkgrup') {
            if (!jid.endsWith('@g.us')) return

            const senderJid = msg.key.participant
            if (!await isGroupAdmin(sock, jid, senderJid)) {
                await reply(jid, '❌ Admin saja')
            }

            const code = await sock.groupInviteCode(jid)
            await reply(jid, `🔗 Link Grup:\nhttps://chat.whatsapp.com/${code}`)
        }

        if (text.toLowerCase() === '!cekadmin' && jid.endsWith('@g.us')) {
            const admins = await getGroupAdmins(sock, jid)
            await sock.sendMessage(jid, {
                text: '👮 Admin Grup:',
                mentions: admins
            })
        }
        if (text.toLowerCase() === '!lock' || text.toLowerCase() === '!unlock') {
            if (!jid.endsWith('@g.us')) return

            const senderJid = msg.key.participant
            if (!await isGroupAdmin(sock, jid, senderJid)) {
                return reply(jid, '❌ Admin saja')
            }

            await sock.groupSettingUpdate(
                jid,
                text === 'lock' ? 'announcement' : 'not_announcement'
            )

            await sock.sendMessage(jid, {
                text: text === 'lock'
                    ? '🔒 Grup dikunci (hanya admin)'
                    : '🔓 Grup dibuka'
            })
        }
        // TARUH DI PALING ATAS handleMessage

        if (text.toLowerCase() === '!info-group' && jid.endsWith('@g.us')) {
            const meta = await sock.groupMetadata(jid)

            await sock.sendMessage(jid, {
                text:
                    `📌 *INFO GRUP*
• Nama: ${meta.subject}
• ID: ${jid}
• Member: ${meta.participants.length}
• Admin: ${meta.participants.filter(p => p.admin).length}`
            })
        }

        if (text.toLowerCase() === '!info') {

            if (!jid.endsWith('@g.us')) {
                await sock.sendMessage(jid, {
                    text: '❌ Command ini hanya bisa digunakan di grup'
                })
                return
            }

            await sock.sendMessage(jid, {
                text: `🆔 *Group ID:*\n${jid}`
            })
        }
        if (text.startsWith('!cek ') && jid.endsWith('@g.us')) {
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
            if (!mentioned || mentioned.length === 0) {
                return reply(jid, 'Tag membernya')
            }

            const meta = await sock.groupMetadata(jid)
            const user = meta.participants.find(p => p.id === mentioned[0])

            await reply(jid, `👤 INFO MEMBER
• Nomor: ${mentioned[0].split('@')[0]}
• Role: ${user.admin ? 'Admin' : 'Member'}`)
        }

        // =====================
        // COMMAND: ADD MEMBER
        // =====================
        if (text.startsWith('!add ')) {

            if (!jid.endsWith('@g.us')) {
                await sock.sendMessage(jid, {
                    text: '❌ Command ini hanya bisa digunakan di grup'
                })
                await reply(jid, menuText)
                return
            }

            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants

            const senderJid = msg.key.participant || msg.key.remoteJid
            const isAdmin = participants.some(p =>
                p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin')
            )

            if (!isAdmin) {
                await reply(jid, '❌ Hanya admin grup yang bisa menambah member')
                return
            }

            const number = text.replace('!add', '').trim()
            const memberJid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

            try {
                await sock.groupParticipantsUpdate(
                    jid,
                    [memberJid],
                    'add'
                )
                await sock.sendMessage(jid, {
                    text: `✅ Berhasil menambahkan @${memberJid.split('@')[0]}`,
                    mentions: [memberJid]
                })

            } catch (err) {
                await reply(jid, '❌ Bot bukan admin atau gagal add member')
                console.error(err)
            }
        }

        // =====================
        // COMMAND: KICK MEMBER (FIXED)
        // =====================
        if (text.startsWith('!kick')) {

            if (!jid.endsWith('@g.us')) {
                await reply(jid, '❌ Command ini hanya untuk grup')
                return
            }

            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants

            const senderJid = msg.key.participant || msg.key.remoteJid

            const isAdmin = participants.some(p =>
                p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin')
            )

            if (!isAdmin) {
                await reply(jid, '❌ Hanya admin grup yang bisa kick member')
                return
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid

            if (!mentioned || mentioned.length === 0) {
                await reply(jid, '❌ Tag member yang ingin di-kick')
                return
            }

            // Filter: jangan kick admin & bot
            const kickTargets = mentioned.filter(jid => {
                const p = participants.find(x => x.id === jid)
                return p && !p.admin && jid !== sock.user.id
            })

            if (kickTargets.length === 0) {
                await reply(jid, '❌ Tidak bisa kick admin atau bot')
                return
            }

            try {
                await sock.groupParticipantsUpdate(jid, kickTargets, 'remove')
                await reply(jid, '🚪 Member berhasil dikeluarkan')
            } catch (err) {
                await reply(jid, '❌ Bot bukan admin atau gagal kick member')
                console.error(err)
            }
        }

        // =====================
        // COMMAND: TAG ALL
        // =====================
        if (text.startsWith('!h')) {

            if (!jid.endsWith('@g.us')) {
                await reply(jid, '❌ Command ini hanya bisa digunakan di grup')
                return
            }

            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants

            const senderJid = msg.key.participant || msg.key.remoteJid

            const isAdmin = participants.some(p =>
                p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin')
            )

            if (!isAdmin) {
                await reply(jid, '❌ Hanya admin grup yang bisa menggunakan h')
                return
            }

            const textMessage = text.replace('!h', '').trim()

            if (!textMessage) {
                await reply(jid, '❌ Sertakan pesan setelah command\nContoh:\n!h Jangan lupa absen')
                return
            }

            const mentions = participants.map(p => p.id)

            await sock.sendMessage(jid, {
                text: `📢 *PENGUMUMAN*\n\n${textMessage}`,
                mentions
            })
        }



        // ===== AUTO REPLY FOR ADMIN =====
        const senderJid = msg.key.participant || msg.key.remoteJid
        const senderNumber = senderJid.split('@')[0]


        // =====================
        // AUTO READ
        // =====================
        // if (session.autoRead === true) {
        //     await sock.readMessages([msg.key])
        // }


        await sendWebhook(sock, msg, text);
        // if (session.typingReply === true) {
        //     await sock.sendPresenceUpdate('composing', jid)
        //     await delay(1200 + Math.random() * 1500)


        //     const delayTime = Math.floor(Math.random() * 2000) + 1000
        //     await new Promise(r => setTimeout(r, delayTime))
        // }

        // if (session.autoReply === true) {
        //     await sock.sendMessage(jid, {
        //         text: "Terima kasih sudah menghubungi kami 🙏"
        //     })
        // }

        // await sock.sendPresenceUpdate("paused", jid)
        // Cek dan balas pesan otomatis jika ada
        // const reply = autoReply(text)
        // if (reply) {
        //     await sock.sendMessage(jid, { text: reply })
        // }

    } catch (err) {
        console.log('messageHandler error: ' + err.message)
    }
};