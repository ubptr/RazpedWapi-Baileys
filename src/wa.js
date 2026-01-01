import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    delay
} from '@whiskeysockets/baileys'
import fs from 'fs'
import handleMessage from './handlers/messageHandler.js'
import { waState } from './state.js'

export async function startWA(mode, phone, io, logger) {
    if (waState.connecting) return
    waState.connecting = true

    const sessionPath =
        mode === 'qr'
            ? './session/qr'
            : `./session/${phone}`

    // 🔴 QR WAJIB session kosong
    if (mode === 'qr' && fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '114.0.0']
    })

    waState.sock = sock
    waState.connected = false
    waState.justScannedQR = false

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        // ===== MODE QR =====
        if (mode === 'qr' && qr) {
            io.emit('qr', qr)
            logger.info('📸 QR generated')
        }
        // ✅ REQUEST PAIRING (SATU KALI, DI OPEN) 
        if (connection === 'connecting' && mode === 'pairing' && !state.creds.registered && !waState.pairingRequested) {
            waState.pairingRequested = true
            logger.info(`[${phone}] Waiting before requesting pairing code...`)
            await delay(5000) // 
            logger.info('Requesting pairing code...')
            const code = await sock.requestPairingCode(phone)
            io.emit('pairing-code', code)
            logger.info(`🔐 Pairing Code: ${code}`)
            return
        }

        if (connection === 'open') {
            waState.connected = true
            waState.connecting = false

            logger.info(`✅ Connected (${mode})`)
            io.emit('connected')

            // 🔥 AUTO SWITCH QR → NORMAL
            if (mode === 'qr') {
                waState.justScannedQR = true

                logger.info('⏳ Waiting WA stabilize before switch...')
                await delay(8000)

                // tutup socket QR
                try {
                    sock.ev.removeAllListeners()
                    sock.ws.close()
                } catch { }

                waState.connecting = false
                waState.connected = false

                logger.info('🔁 Switching to NORMAL mode')
                startWA('normal', phone, io, logger)
            }
        }

        if (connection === 'close') {
            waState.connected = false
            waState.connecting = false

            const reason = lastDisconnect?.error?.output?.statusCode
            logger.warn(`❌ Disconnected (${mode}): ${reason}`)

            // 🚫 JANGAN reconnect di QR
            if (mode === 'qr') return

            // ⏳ delay khusus 515
            if (reason === 515) {
                await delay(8000)
            }

            if (reason !== DisconnectReason.loggedOut) {
                startWA('normal', phone, io, logger)
            }
        }
    })

    // ===== MESSAGE HANDLER (NORMAL ONLY) =====
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (const msg of messages) { await handleMessage(sock, msg, logger) }
    })
}


export function stopWA(logger) {
    if (!waState.sock) return

    waState.sock.ev.removeAllListeners()
    waState.sock.ws.close()
    clearSession()
    waState.sock = null
    waState.connecting = false
    waState.connected = false
    waState.pairingSent = false

    logger.info('WA stopped')
}

export function clearSession() {
    if (fs.existsSync('./session')) {
        fs.rmSync('./session', { recursive: true, force: true })
    }
}
