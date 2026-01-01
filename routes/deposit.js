import express from 'express';
import dotenv from 'dotenv';

import { createUser, getUserBy, updateUserBy } from '../models/User.js';
import {
    getSessionBy,
    insertSessions,
    getSession,
    getAllSession
} from '../models/WaSession.js';
import { getAllMethod, getMethodById } from '../models/DepositMethod.js';
import { insertDeposits, getDeposit } from '../models/Deposit.js';

// import TelegramService from '../service/TelegramSend.js';
import { generateInvoiceNumber, getDueTime } from '../helpers.js';

dotenv.config();

const router = express.Router();

// ================= DEPOSIT BARU =================
router.get('/baru', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    let services = await getAllMethod();
    if (!Array.isArray(services)) {
        services = [];
    }

    res.render('deposit/baru', {
        services,
        username: req.session.user.username,
        user: req.session.user
    });
});

// ================= INVOICE =================
router.get('/invoice/:invoice', async (req, res) => {
    try {
        const invoice = req.params.invoice;

        const deposit = await getDeposit({
            no_invoice: invoice,
            username: req.session.user.username
        });

        if (!deposit) {
            req.session.errorMessage = 'Kode Deposit tidak ditemukan!';
            return res.redirect('/deposit/list');
        }

        res.render('deposit/invoice', {
            deposit,
            username: req.session.user.username
        });
    } catch (error) {
        console.error('Error checking invoice:', error);
        req.session.errorMessage = 'Terjadi kesalahan, coba lagi nanti!';
        res.redirect('/deposit/list');
    }
});

// ================= LIST =================
router.get('/list', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    try {
        const session = await getAllSession();

        res.render('device/list', {
            session: session ?? null,
            username: req.session.user.username,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).send('Something went wrong. Please try again later.');
    }
});

// ================= PROSES DEPOSIT =================
router.post('/baru', async (req, res) => {
    try {
        const { amount, method } = req.body;

        if (!amount || !method) {
            req.session.errorMessage = 'Semua kolom harus diisi!';
            return res.redirect('/deposit/baru');
        }

        const user = await getUserBy('username', req.session.user.username);
        if (!user) {
            req.session.errorMessage = 'Anda harus login terlebih dahulu!';
            return res.redirect('/auth/login');
        }

        const Method = await getMethodById(method);
        if (!Method) {
            req.session.errorMessage = 'Metode Deposit tidak ditemukan!';
            return res.redirect('/deposit/baru');
        }

        if (amount < Method.min) {
            req.session.errorMessage = `Minimal Deposit Sebesar Rp${Method.min}`;
            return res.redirect('/deposit/baru');
        }

        const detectPendingDeposit = await getDeposit({
            username: user.username,
            status: 'Pending'
        });

        if (detectPendingDeposit) {
            req.session.errorMessage = 'Kamu masih memiliki Deposit Pending!';
            return res.redirect('/deposit/baru');
        }

        const invoice = generateInvoiceNumber();

        await insertDeposits(req.body, user.username, Method, invoice);

//         const message = `📢 [NOTIFIKASI DEPOSIT RAZPEDWABOT]

// 👤 Username: ${user.username}
// 🧾 Invoice: #${invoice}
// 🏦 Provider: ${Method.provider}
// 💳 Metode: ${Method.type} - ${Method.payment}
// 💰 Transfer: Rp *${amount}*
// 📈 Saldo Masuk: Rp *${amount * Method.rate}*
// ⚙️ Sistem: ${Method.system}
// 📅 Waktu: ${new Date().toLocaleString()} WIB
//         `;

//         const telegramService = new TelegramService('-983671729');
//         await telegramService.sendButtons(message, [
//             [{ text: 'Lihat Info Member', callback_data: `detail_user:${user.username}` }],
//             [{ text: 'Batalkan', callback_data: `cancel_deposit:${invoice}` }],
//             [{ text: 'Setujui', callback_data: `acc_deposit:${invoice}` }]
//         ]);

        req.session.successMessage = 'Deposit Berhasil Dibuat!';
        res.redirect(`/deposit/invoice/${invoice}`);
    } catch (error) {
        console.error('Error saat memproses deposit:', error);
        req.session.errorMessage = 'Terjadi kesalahan, coba lagi nanti!';
        res.redirect('/deposit/baru');
    }
});

export default router;
