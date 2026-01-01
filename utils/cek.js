import { Server } from 'socket.io'
import {
    initializeWhatsApp,
    deleteWhatsApp
} from '../utils/waManager.js'
import { createLogger } from '../src/logger.js'
let io

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: { origin: '*' }
    })

    io.on('connection', (socket) => {
        const logger = createLogger(io)
        console.log('🟢 Client connected')
        socket.on('start_session', async (botPhoneNumber) => {
            const session = (await getSessionBy('botPhoneNumber', botPhoneNumber))[0];
            if (session) {
                // Jika sesi ada, inisialisasi WhatsApp
                initializeWhatsApp({
                    io,
                    username: data.username,
                    method: data.method,   // qr | pairing
                    phone: data.phone,
                    logger
                })
            } else {
                socket.emit('message', 'Sesi bot tidak ditemukan.');
            }
        });
        socket.on('wa:start', async (data) => {
            await initializeWhatsApp({
                io,
                username: data.username,
                method: data.method,
                phone: data.phone,
                logger
            })
        })

        socket.on('delete_session', async (username) => {
            await deleteWhatsApp(username, io)
            socket.emit('wa:deleted')
        })
        socket.on('check_session', async (botPhoneNumber) => {
            // Mencari sesi berdasarkan bot number

        });
    })
}

export { io }
