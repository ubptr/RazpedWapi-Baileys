export default function authView(req, res, next) {
    res.locals.user = req.session.user || null;
    next();
}
