import readline from 'readline-sync'
import { startWA } from './wa.js'

console.log('=== WhatsApp Basic Gateway ===')

// =====================
// PILIH SESSION
// =====================
const session = readline.question(
  'Nama session (misal: toko-1): '
)

// =====================
// PILIH LOGIN MODE
// =====================
console.log('\nPilih Login Mode:')
console.log('1. QR Code')
console.log('2. Pairing Code')

const modeInput = readline.question('Pilihan (1/2): ')

let mode = 'qr'
let phone = null

if (modeInput === '2') {
  mode = 'pairing'
  phone = readline.question('Nomor WA (62xxx): ')
}

// =====================
// START WHATSAPP
// =====================
await startWA({
  session,
  mode,
  phone
})

console.log('⏳ Menunggu event WhatsApp...\n')
