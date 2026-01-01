import express from 'express'
import auth from '../middleware/authMiddleware.js'
import limit from '../middleware/paketMiddleware.js'

const router = express.Router()

router.get('/', auth, (req, res) => {
    res.render('wa/index')
})

router.post('/start', auth, limit, (req, res) => {
    res.json({ success: true })
})

export default router
