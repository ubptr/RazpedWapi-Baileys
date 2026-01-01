import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { startWA, stopWA } from './wa.js'
import { createLogger } from './logger.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public'))

io.on('connection', (socket) => {
    const logger = createLogger(io)
    logger.info('Web connected')

    socket.on('start', async ({ mode, phone }) => {
        await startWA(mode, phone, io, logger)
    })

    socket.on('stop', () => {
        stopWA(logger)
    })
})

server.listen(3000, () => {
    console.log('✅ WA Gateway running on port 3000')
})
