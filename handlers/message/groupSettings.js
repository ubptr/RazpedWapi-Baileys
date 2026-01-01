const groupSettings = new Map()

export function setDeleteStatus(groupJid, status) {
  groupSettings.set(groupJid, {
    delete: status
  })
}

export function isDeleteEnabled(groupJid) {
  return groupSettings.get(groupJid)?.delete === true
}
