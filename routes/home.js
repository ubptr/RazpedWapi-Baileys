import express from 'express'
const router = express.Router();
import 'dotenv/config'

// Halaman login
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login')
    }

    res.render('home', { username: req.session.user.username });
});

// Halaman register
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});
export default router
