import pool from '../config/db.js'

export default async function paketMiddleware(req, res, next) {
    const user = req.session.user

    const [[paket]] = await pool.query(
        'SELECT * FROM paket WHERE id = ?',
        [user.paket_id]
    )

    const [[count]] = await pool.query(
        'SELECT COUNT(*) as total FROM wa_sessions WHERE user_id = ? AND status = "connected"',
        [user.id]
    )

    if (count.total >= paket.max_device) {
        return res.status(403).json({
            error: 'Limit device paket tercapai'
        })
    }

    next()
}
