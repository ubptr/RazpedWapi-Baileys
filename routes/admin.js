// routes/admin.js
import express from 'express';
import db from '../config/db.js'; // pastikan db pakai export default
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Middleware untuk verifikasi level Admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.level === 'Developers') {
        return next();
    }
    return res.redirect('/auth/login');
}

// ================= USERS =================

// GET semua user
router.get('/users', isAdmin, async (req, res) => {
    const [users] = await db.query('SELECT * FROM users');
    res.render('admin/users/index', { users });
});

// Ubah saldo pengguna
router.post('/users/balance/:id', isAdmin, async (req, res) => {
    const { balance } = req.body;
    await db.query(
        'UPDATE users SET balance=? WHERE id=?',
        [balance, req.params.id]
    );
    res.redirect('/admin/users');
});

// Tambah user
router.post('/users/add', isAdmin, async (req, res) => {
    const { name, username, email, phone, password, level } = req.body;

    const apiKey = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
        `INSERT INTO users 
        (name, username, email, phone, password, balance, \`usage\`, level, status, code_verifikasi, status_api, api_key, ip_static, uplink, register_at, read_news, random_token, remember_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            username,
            email,
            phone,
            hashedPassword,
            0,
            0,
            level ?? 'Basic',
            'Active',
            '-',
            'Inactive',
            apiKey,
            '',
            'Upby Sistem',
            new Date(),
            'false',
            '',
            ''
        ]
    );

    req.session.successMessage = 'User berhasil dibuat!';
    res.redirect('/admin/users');
});

// Edit user
router.post('/users/edit/:id', isAdmin, async (req, res) => {
    const { name, email, phone, level, status } = req.body;

    await db.query(
        'UPDATE users SET name=?, email=?, phone=?, level=?, status=? WHERE id=?',
        [name, email, phone, level, status, req.params.id]
    );

    res.redirect('/admin/users');
});

// Hapus user
router.post('/users/delete/:id', isAdmin, async (req, res) => {
    await db.query(
        'DELETE FROM users WHERE id=?',
        [req.params.id]
    );
    res.redirect('/admin/users');
});

// ================= WA SESSIONS =================

// GET semua sesi WA
router.get('/device', isAdmin, async (req, res) => {
    const [sessions] = await db.query('SELECT * FROM wa_sessions');
    res.render('admin/device/index', { sessions });
});

// Tambah sesi WA
router.post('/device/add', isAdmin, async (req, res) => {
    const {
        username,
        botName,
        botPhoneNumber,
        packageName,
        packageDuration,
        packageStatus
    } = req.body;

    await db.query(
        `INSERT INTO wa_sessions
        (username, botName, botPhoneNumber, packageName, packageDuration, packageStatus, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
            username,
            botName,
            botPhoneNumber,
            packageName,
            packageDuration,
            packageStatus
        ]
    );

    res.redirect('/admin/device');
});

// Edit sesi WA
router.post('/device/edit/:id', isAdmin, async (req, res) => {
    const {
        botName,
        packageName,
        packageDuration,
        packageStatus,
        personalWebhookUrl,
        groupWebhookUrl,
        is_active
    } = req.body;

    await db.query(
        `UPDATE wa_sessions
        SET botName=?, packageName=?, packageDuration=?, packageStatus=?,
            personalWebhookUrl=?, groupWebhookUrl=?, is_active=?
        WHERE id=?`,
        [
            botName,
            packageName,
            packageDuration,
            packageStatus,
            personalWebhookUrl,
            groupWebhookUrl,
            is_active,
            req.params.id
        ]
    );

    res.redirect('/admin/device');
});

// Hapus sesi WA
router.post('/device/delete/:id', isAdmin, async (req, res) => {
    await db.query(
        'DELETE FROM wa_sessions WHERE id=?',
        [req.params.id]
    );
    res.redirect('/admin/device');
});

export default router;
