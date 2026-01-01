import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import Joi from 'joi'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

import { createUser, getUserBy } from '../models/User.js'
import { insertLogs } from '../models/Log.js'

dotenv.config()

const router = express.Router()
const sessions = {}

// Fix __dirname di ES Module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// =======================
// Halaman Login
// =======================
router.get('/login', (req, res) => {
    res.render('login', { error: null })
})

// =======================
// Halaman Register
// =======================
router.get('/register', (req, res) => {
    res.render('register', { error: null })
})

// =======================
// Proses Login
// =======================
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body
        const userAgent = req.get('User-Agent')

        const user = await getUserBy('username', username)

        if (!user) {
            req.session.errorMessage = 'Username tidak ditemukan!'
            return res.redirect('/auth/login')
        }

        if (user.status === 'Locked') {
            req.session.errorMessage = 'Akun Kamu Dikunci!'
            return res.redirect('/auth/login')
        }

        if (user.status === 'Suspend') {
            req.session.errorMessage = 'Akun Kamu disuspend!'
            return res.redirect('/auth/login')
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            req.session.errorMessage = 'Username atau password salah!'
            return res.redirect('/auth/login')
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        req.session.token = token

        if (rememberMe) {
            res.cookie('rememberMe', token, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            })
        }

        await insertLogs('Login', username, userAgent)

        req.session.user = user
        req.session.successMessage = 'Login berhasil!'
        return res.redirect('/')

    } catch (error) {
        console.error('Error Login:', error)
        req.session.errorMessage = 'Terjadi Kesalahan!'
        return res.redirect('/auth/login')
    }
})

// =======================
// Proses Register
// =======================
router.post('/register', async (req, res) => {
    try {
        const registerSchema = Joi.object({
            fullName: Joi.string().min(3).required(),
            username: Joi.string().min(3).required(),
            phone: Joi.string().min(10).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        })

        const { error } = registerSchema.validate(req.body)
        if (error) {
            req.session.errorMessage = error.details[0].message
            return res.redirect('/auth/register')
        }

        const { phone, username, email } = req.body

        if (await getUserBy('phone', phone)) {
            req.session.errorMessage = 'Nomor HP sudah terdaftar!'
            return res.redirect('/auth/register')
        }

        if (await getUserBy('email', email)) {
            req.session.errorMessage = 'Email sudah terdaftar!'
            return res.redirect('/auth/register')
        }

        if (await getUserBy('username', username)) {
            req.session.errorMessage = 'Username sudah terdaftar!'
            return res.redirect('/auth/register')
        }

        await createUser(req.body)

        req.session.successMessage = 'User berhasil dibuat!'
        return res.redirect('/auth/login')

    } catch (error) {
        console.error('Registration error:', error)
        req.session.errorMessage = 'Terjadi kesalahan saat registrasi!'
        return res.redirect('/auth/register')
    }
})

// =======================
// Logout
// =======================
router.get('/logout', (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login')

    const username = req.session.user.username
    const sessionPath = path.join(__dirname, '../session/Default', username)

    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true })
    }

    if (sessions[username]) {
        sessions[username].destroy()
        delete sessions[username]
    }

    req.session.destroy(() => {
        res.clearCookie('rememberMe')
        res.redirect('/auth/login')
    })
})

export default router
