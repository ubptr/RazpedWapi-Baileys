const messageStore = new Map()

export function saveMessage(msg) {
  if (!msg?.key?.id) return
  messageStore.set(msg.key.id, msg)
}

export function getMessage(id) {
  return messageStore.get(id)
}

export function deleteMessage(id) {
  messageStore.delete(id)
}
