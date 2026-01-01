import express from 'express'
import axios from 'axios'
import { getUserBy } from '../models/User.js'
import { getSession } from '../models/WaSession.js'
import {verifyApiKey} from '../middleware/verifyApiKey.js'
import { waRuntime } from '../utils/waRuntime.js'

const router = express.Router()

router.use(express.json())
router.use(express.urlencoded({ extended: true }))

// ============================
// HELPER
// ============================
const normalizeJid = (number) => {
    if (number.endsWith('@g.us') || number.endsWith('@s.whatsapp.net')) {
        return number
    }
    return number + '@s.whatsapp.net'
}

// ============================
// SEND TEXT
// ============================
router.post('/send-text', verifyApiKey, async (req, res) => {
    const { apiKey, deviceName, number, message } = req.body

    if (!number || !message) {
        return res.status(400).json({
            status: false,
            message: 'number dan message wajib diisi'
        })
    }

    try {
        const user = await getUserBy('api_key', apiKey)
        if (!user) throw 'User tidak ditemukan'

        const waSession = await getSession({
            username: user.username,
            botName: deviceName
        })
        if (!waSession) throw 'Perangkat tidak ditemukan'

        const runtime = waRuntime.sessions.get(waSession.botPhoneNumber)
        if (!runtime?.sock) throw 'WA belum terkoneksi'


        await runtime.sock.sendMessage(number, { text: message })

        res.json({
            status: true,
            message: 'Pesan berhasil dikirim',
            data: { number, deviceName }
        })

    } catch (err) {
        console.error('Failed to send message:', err);
        return res.status(500).send({
            status: false,
            message: "Failed to send message.",
            error: err.toString()
        });
    }
})


// ============================
// SEND MEDIA (IMAGE / FILE)
// ============================
router.post('/send-media', verifyApiKey, async (req, res) => {
    const { apiKey, deviceName, number, mediaUrl, caption } = req.body

    if (!number || !mediaUrl) {
        return res.status(400).json({
            status: false,
            message: 'number dan mediaUrl wajib diisi'
        })
    }

    try {
        const user = await getUserBy('api_key', apiKey)
        if (!user) throw 'User tidak ditemukan'

        const waSession = await getSession({
            username: user.username,
            botName: deviceName
        })
        if (!waSession) throw 'Perangkat tidak ditemukan'

        const runtime = waRuntime.sessions.get(waSession.botPhoneNumber)
        if (!runtime?.sock) throw 'WA belum terkoneksi'


        const response = await axios.get(mediaUrl, {
            responseType: 'arraybuffer'
        })

        const buffer = Buffer.from(response.data)
        const mime = response.headers['content-type']

        await runtime.sock.sendMessage(number, {
            image: buffer,
            mimetype: mime,
            caption: caption || ''
        })

        res.json({
            status: true,
            message: 'Media berhasil dikirim'
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({
            status: false,
            message: err.toString()
        })
    }
})


// ============================
// ADD MEMBER GROUP
// ============================
router.post('/add-member', verifyApiKey, async (req, res) => {
    const { apiKey, deviceName, groupId, number } = req.body

    if (!groupId || !number) {
        return res.status(400).json({
            status: false,
            message: 'groupId dan number wajib diisi'
        })
    }

    try {
        const user = await getUserBy('api_key', apiKey)
        if (!user) throw 'User tidak ditemukan'

        const waSession = await getSession({
            username: user.username,
            botName: deviceName
        })
        if (!waSession) throw 'Perangkat tidak ditemukan'

        const runtime = waRuntime.sessions.get(waSession.botPhoneNumber)
        if (!runtime?.sock) throw 'WA belum terkoneksi'

        const participant = normalizeJid(number)

        await runtime.sock.groupParticipantsUpdate(
            groupId,
            [participant],
            'add'
        )

        res.json({
            status: true,
            message: 'Member berhasil ditambahkan'
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({
            status: false,
            message: err.toString()
        })
    }
})

export default router
