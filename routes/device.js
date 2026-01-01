import express from 'express'
import dotenv from 'dotenv'
import connection from '../config/db.js'

import { createUser, getUserBy, updateUserBy } from '../models/User.js'
import {
    getSessionBy,
    insertSessions,
    getSession,
    getAllSession,
    updateWebhook
} from '../models/WaSession.js'

import { getAllService, getServiceById } from '../models/Service.js'
import { insertHistorySaldo } from '../models/HistorySaldo.js'

dotenv.config()

const router = express.Router()

/**
 * =========================
 *  DEVICE BARU
 * =========================
 */
router.get('/baru', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login')
    }

    let services = await getAllService()
    if (!Array.isArray(services)) services = []

    res.render('device/baru', {
        services,
        username: req.session.user.username,
        user: req.session.user
    })
})

/**
 * =========================
 *  LIST DEVICE
 * =========================
 */
router.get('/list', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login')
    }

    try {
        const [session] = await connection.execute(
            'SELECT * FROM wa_sessions WHERE username = ?',
            [req.session.user.username]
        )

        res.render('device/list', {
            session: session ?? null,
            username: req.session.user.username,
            user: req.session.user
        })
    } catch (error) {
        console.error('Error fetching sessions:', error)
        res.status(500).send('Something went wrong. Please try again later.')
    }
})

/**
 * =========================
 *  EDIT DEVICE
 * =========================
 */
router.get('/edit/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params

        const session = await getSession({
            botPhoneNumber: phoneNumber,
            username: req.session.user.username
        })

        if (!session) {
            req.session.errorMessage = 'Nomor HP tidak ditemukan!'
            return res.redirect('/device/list')
        }

        res.render('device/edit', {
            session,
            username: req.session.user.username
        })
    } catch (error) {
        console.error('Error checking phone number:', error)
        req.session.errorMessage = 'Terjadi kesalahan, coba lagi nanti!'
        res.redirect('/device/list')
    }
})

router.post('/edit/:phoneNumber', async (req, res) => {
    // nanti bisa diisi update webhook / rename device
})

/**
 * =========================
 *  CREATE DEVICE
 * =========================
 */
router.post('/baru', async (req, res) => {
    try {
        const { deviceId, deviceName, devicePhone } = req.body

        if (!deviceId || !deviceName || !devicePhone) {
            req.session.errorMessage = 'Semua kolom harus diisi!'
            return res.redirect('/device/baru')
        }

        const user = await getUserBy('username', req.session.user.username)
        if (!user) {
            req.session.errorMessage = 'Anda harus login terlebih dahulu!'
            return res.redirect('/auth/login')
        }

        const services = await getServiceById(deviceId)
        if (!services) {
            req.session.errorMessage = 'Data Paket tidak ditemukan!'
            return res.redirect('/device/baru')
        }

        // Validasi nama device
        const deviceNameRegex = /^[A-Za-z0-9]+$/
        if (!deviceNameRegex.test(deviceName)) {
            req.session.errorMessage =
                'Nama perangkat hanya boleh huruf & angka tanpa spasi!'
            return res.redirect('/device/baru')
        }

        // Cek nomor WA
        const detectPhone = (await getSessionBy('botPhoneNumber', devicePhone))[0]
        if (detectPhone) {
            req.session.errorMessage = 'Nomor Hp sudah digunakan!'
            return res.redirect('/device/baru')
        }

        // Cek nama bot
        const detectName = await getSession({
            botName: deviceName,
            username: user.username
        })
        if (detectName) {
            req.session.errorMessage = 'Nama Bot sudah digunakan!'
            return res.redirect('/device/baru')
        }

        // Trial limit
        if (services.type === 'Trial') {
            const trial = await getSession({
                packageName: 'Trial',
                username: user.username
            })
            if (trial) {
                req.session.errorMessage = 'Batas Trial sudah habis!'
                return res.redirect('/device/baru')
            }
        }

        // Saldo
        if (user.balance < services.price) {
            req.session.errorMessage =
                `Saldo tidak mencukupi untuk paket ${services.type} ${services.duration}`
            return res.redirect('/device/baru')
        }

        // Validasi nomor
        const phoneRegex = /^628\d{7,12}$/
        if (!phoneRegex.test(devicePhone)) {
            req.session.errorMessage =
                'Nomor harus diawali 628 dan 10–15 digit!'
            return res.redirect('/device/baru')
        }

        // INSERT
        await insertSessions(req.body, user.username)
        await insertHistorySaldo(
            'Debit', 
            user,
            services.price,
            `Order Paket ${services.type} ${services.duration}`
        )

        await updateUserBy(
            {
                balance: user.balance - services.price,
                usage: user.usage + services.price
            },
            { username: user.username }
        )

        req.session.successMessage = 'Pesanan berhasil dibuat!'
        res.redirect('/device/list')

    } catch (error) {
        console.error('Error saat memproses pesanan:', error)
        req.session.errorMessage = 'Terjadi kesalahan, coba lagi nanti!'
        res.redirect('/device/baru')
    }
})

export default router
