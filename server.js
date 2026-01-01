import 'dotenv/config'
import express from 'express'
import http from 'http'
import path from 'path'
import session from 'express-session'
import MySQLStoreFactory from 'express-mysql-session'

import pool from './config/db.js'
import { initializeSocket } from './utils/socket.js'
import webSettingsMiddleware from './middleware/webSettingsMiddleware.js'
import flashMessageMiddleware from './middleware/flashMessageMiddleware.js'
// ROUTES
import authRoutes from './routes/auth.js'
import waRoutes from './routes/wa.js'
import homeRoutes from './routes/home.js'
import adminRoutes from './routes/admin.js'
import deviceRoutes from './routes/device.js'
import depositRoutes from './routes/deposit.js'
import apiRoutes from './routes/api.js'
// NODELS
import { getUserById } from './models/User.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)

const MySQLStore = MySQLStoreFactory(session)

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'secret',
    store: new MySQLStore({}, pool),
    resave: false,
    saveUninitialized: false
})
app.use('/api/v1', apiRoutes);
app.use(sessionMiddleware)
app.use(async (req, res, next) => {
    if (req.session.user) {
        try {
            const user = await getUserById(req.session.user.id);
            if (user) {
                res.locals.user = user;
            } else {
                res.locals.user = null;
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});
app.use((req, res, next) => {
    res.locals.app_url = process.env.APP_URL;
    next();
});

app.use(flashMessageMiddleware)
app.use(webSettingsMiddleware);

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ROUTES
app.use('/auth', authRoutes)
app.use('/device', deviceRoutes);
app.use('/admin', adminRoutes);
app.use('/deposit', depositRoutes);

app.use('/wa', waRoutes)
app.use('/', homeRoutes)

// SOCKET
initializeSocket(server, sessionMiddleware)

server.listen(process.env.PORT || 3000, () => {
    console.log('🚀 Server running on port', process.env.PORT || 3000)
})
