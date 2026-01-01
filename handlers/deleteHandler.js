import { getMessage } from './message/messageStore.js'
import { isDeleteEnabled } from './message/groupSettings.js'

export default async function handleDelete(sock, deleted) {
  try {
    const { keys } = deleted

    for (const key of keys) {
      const remoteJid = key.remoteJid
      if (!remoteJid?.endsWith('@g.us')) continue

      if (!isDeleteEnabled(remoteJid)) return

      const msg = getMessage(key.id)
      if (!msg?.message) return

      const sender = msg.key.participant || msg.key.remoteJid
      const user = sender.split('@')[0]

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '[Media]'

      await sock.sendMessage(remoteJid, {
        text:
          `🚫 *Pesan Dihapus*\n` +
          `👤 @${user}\n` +
          `💬 ${text}`,
        mentions: [sender]
      })
    }
  } catch (e) {
    console.error('delete handler error:', e)
  }
}
