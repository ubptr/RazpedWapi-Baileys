const rules = [
  {
    keywords: ['halo', 'hai', 'hello'],
    reply: 'Halo 👋 Ada yang bisa kami bantu?',
  },
  {
    keywords: ['harga', 'price'],
    reply: 'Untuk info harga silakan kunjungi https://razped.com',
  },
  {
    keywords: ['admin'],
    reply: 'Admin akan membalas secepatnya 🙏',
  },
]

export default function autoReply(text) {
  if (typeof text !== 'string') {
    console.log('Pesan tidak valid:', text);
    return null;  // Menjaga agar hanya teks yang diproses
  }

  // Convert teks ke lowercase agar lebih fleksibel
  const msg = text.toLowerCase().trim()

  // Loop untuk cek semua aturan balasan
  for (const rule of rules) {
    // Cek apakah ada salah satu keyword yang cocok dengan teks pesan
    if (rule.keywords.some(k => msg.includes(k))) {
      return rule.reply
    }
  }

  // Jika tidak ada aturan yang cocok, kembalikan null
  return null
}
