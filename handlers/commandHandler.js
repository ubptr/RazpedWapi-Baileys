import { setDeleteStatus } from './message/groupSettings.js'

export default async function handleCommand(sock, msg) {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text

  if (!text?.startsWith('!')) return

  const from = msg.key.remoteJid
  if (!from.endsWith('@g.us')) return

  const sender = msg.key.participant

  // cek admin
  const meta = await sock.groupMetadata(from)
  const isAdmin = meta.participants
    .find(p => p.id === sender)
    ?.admin

  if (!isAdmin) {
    await sock.sendMessage(from, {
      text: '❌ Hanya admin yang bisa pakai perintah ini'
    })
    return
  }

  const [cmd, value] = text.split(' ')

  if (cmd === '!setdelete') {
    if (value === 'on') {
      setDeleteStatus(from, true)
      await sock.sendMessage(from, { text: '✅ Anti-delete AKTIF' })
    } else if (value === 'off') {
      setDeleteStatus(from, false)
      await sock.sendMessage(from, { text: '❌ Anti-delete NONAKTIF' })
    } else {
      await sock.sendMessage(from, {
        text: 'Gunakan: !setdelete on / off'
      })
    }
  }
}
