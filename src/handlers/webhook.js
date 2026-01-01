import axios from 'axios'
import config from '../config/webhook.js'
import {
  getSessionBy
} from '../../models/WaSession.js'

export default async function sendWebhook(sock, message, text) {
  try {
    const { from, body, key } = message
    const { id } = sock.user
    const jid = message.key.remoteJid
    const waSession = (await getSessionBy('wid', id))[0]
    if (!waSession) return

    const remoteJid = key.remoteJid
    const isGroup = remoteJid.endsWith('@g.us')

    const urlClient = isGroup
      ? waSession.groupWebhookUrl
      : waSession.personalWebhookUrl

    if (!urlClient) return

    const safeText = typeof text === 'string' ? text : ''

    const response = await axios.post(urlClient, {
      text: safeText,
      user: from,
      sender: 'server'
    })

    const replyText =
      typeof response?.data?.text === 'string'
        ? response.data.text
        : null
    if (replyText) {

      await sock.sendMessage(jid, { text: replyText })
    }

  } catch (err) {
    console.error('Webhook error:', err)
  }
}
