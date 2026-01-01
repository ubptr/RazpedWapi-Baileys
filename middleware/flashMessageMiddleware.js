// middleware/flashMessageMiddleware.js
export default function flashMessageMiddleware(req, res, next) {

    // 🛡️ pastikan req.session ada
    if (!req.session) {
        res.locals.successMessage = null
        res.locals.errorMessage = null
        return next()
    }

    res.locals.successMessage = req.session.successMessage || null
    res.locals.errorMessage = req.session.errorMessage || null

    // hapus setelah dipakai
    req.session.successMessage = null
    req.session.errorMessage = null

    next()
}
