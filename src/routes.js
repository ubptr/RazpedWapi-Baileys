import express from 'express'
import { startWA } from './wa.js'

const router = express.Router()
const clients = {}

router.get('/start', async (req, res) => {
  const { session, phone } = req.body

  const { sock, code } = await startWA(session, phone)
  clients[session] = sock

  res.json({
    status: 'ok',
    pairing_code: code
  })
})

router.post('/send', async (req, res) => {
  const { session, to, message } = req.body
  const sock = clients[session]

  await sock.sendMessage(`${to}@s.whatsapp.net`, { text: message })
  res.json({ status: 'sent' })
})

export default router
