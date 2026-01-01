import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    delay
} from '@whiskeysockets/baileys'
import handleMessage from '../src/handlers/messageHandler.js'
const sessions = new Map()

export const initializeWhatsApp = async ({
    io,
    username,
    method = 'qr',
    phone = null,
    logger
}) => {
    if (sessions.has(username)) return

    const { state, saveCreds } = await useMultiFileAuthState(
        `./sessions/${username}`
    )

    const sock = makeWASocket({
        // logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        // webSocket: wrtc,
    })

    sessions.set(username, sock)



    sock.ev.on('connection.update', async (update) => {
        try {
            const { connection, qr, lastDisconnect } = update

            // if (qr && method === 'qr') {
            //     io.emit('wa:qr', qr)
            //     io.emit('message', '📸 QR generated')
            //     logger.info('📸 QR generated')
            // }
            // 🔑 PAIRING CODE
            if (connection === 'connecting' && method === 'pairing') {
                if (!username) {
                    io.emit('message', 'Nomor WhatsApp wajib diisi')
                    return
                }
                await delay(5000)
                io.emit('message', `[${username}] Waiting before requesting pairing code...`)
                const code = await sock.requestPairingCode(username)
                io.emit('wa:pairing-code', code)
                io.emit('message', `🔐 Pairing Code: ${code}`)
                console.log(`🔐 Pairing Code: ${code}`)
                return
            }

            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                io.emit("message", 'error: '+reason);

                const isLoggedOut = reason === DisconnectReason.loggedOut;

                if (isLoggedOut) {
                    // fs.rmSync("./sessions", { recursive: true, force: true });
                    // qrCodeBase64 = "reconnect";
                }

                if (reason) {
                    console.log('Attempting to reconnect...');
                    // sock = await initializeWhatsApp(io, username, 'qr', null, logger); // Panggil ulang inisialisasi jika perlu
                }
            } else if (connection === 'open') {
                io.emit('wa:ready', {
                    id: sock.user.id,
                    name: sock.user.name
                });
                io.emit('message', `✅ Connected (${method})`);
                io.emit('connected');
            }
            // if (connection === 'close') {
            //     const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            //     // const reason = lastDisconnect?.error?.output?.statusCode
            //     io.emit('message', `❌ Disconnected (${method}): ${reason}`)

            //      if (method === 'qr') return

            //     // ⏳ delay khusus 515
            //     if (reason === 515) {
            //         await delay(8000)
            //     }

            //     console.log(`❌ Disconnected (${method}): ${reason}`)
            //     if (reason !== DisconnectReason.loggedOut) {
            //         sessions.delete(username)
            //     }
            // }
        } catch (err) {
            console.error("Error in connection.update handler:", err);
        }
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (const msg of messages) { await handleMessage(sock, msg, logger) }
    })
}

export const deleteWhatsApp = async (username, io) => {
    const session = waSessions.get(username)
    if (!session) return

    await session.sock.logout()
    waSessions.delete(username)

    fs.rmSync(`./sessions/${username}`, { recursive: true, force: true })

    await updateSessionDB(username, {
        status: 'DISCONNECTED',
        wid: null,
        pushname: null
    })

    io.emit('wa:deleted', username)
}

export { sessions }
