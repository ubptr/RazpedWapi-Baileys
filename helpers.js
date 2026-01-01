// =======================
// DEVICE TYPE DETAIL
// =======================
export function getDeviceType(ua = '') {
    let device = 'Other'

    if (ua.includes('Redmi Note 8 Pro Build')) device = 'Redmi Note 8 Pro'
    else if (ua.includes('Redmi Note 8 Build')) device = 'Redmi Note 8'
    else if (ua.includes('Redmi 8A Pro')) device = 'Redmi 8A Pro'
    else if (ua.includes('Redmi 8')) device = 'Redmi 8'
    else if (ua.includes('Redmi Note 9 Pro')) device = 'Redmi Note 9 Pro'
    else if (ua.includes('Redmi Note 10 Pro')) device = 'Redmi Note 10 Pro'
    else if (ua.includes('Redmi Note 10')) device = 'Redmi Note 10'
    else if (ua.includes('Redmi Note 11 Pro')) device = 'Redmi Note 11 Pro'
    else if (ua.includes('M2007J3SG')) device = 'Xiaomi Mi 10T Pro 5G'
    else if (ua.includes('2201117TY')) device = 'Xiaomi Redmi Note 11'
    else if (ua.includes('Redmi Note 5')) device = 'Redmi Note 5'
    else if (ua.includes('Redmi 5')) device = 'Redmi 5'
    else if (ua.includes('Windows NT 10.0')) device = 'Windows 10'
    else if (ua.includes('Mac OS X 10_15_7')) device = 'Mac OS X'
    else if (ua.includes('iPhone')) device = 'iPhone'

    return device
}

// =======================
// DEVICE CATEGORY
// =======================
export function getDevices(userAgent = '') {
    if (/Mobi|Android|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        return 'Mobile'
    }
    return 'Desktop'
}

// =======================
// OS VERSION
// =======================
export function getClientOsType(ua = '') {
    if (ua.includes('Android 14')) return 'Android 14'
    if (ua.includes('Android 13')) return 'Android 13'
    if (ua.includes('Android 12')) return 'Android 12'
    if (ua.includes('Android 11')) return 'Android 11'
    if (ua.includes('Android 10')) return 'Android 10'
    if (ua.includes('Android 9')) return 'Android 9'
    if (ua.includes('iPhone OS 16_5')) return 'iOS 16.5'
    if (ua.includes('iPhone OS 16_2')) return 'iOS 16.2'
    if (ua.includes('Windows NT 10.0')) return 'Windows 10'

    return 'Other'
}

// =======================
// OS NAME
// =======================
export function getClientOs(ua = '') {
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('Linux')) return 'Linux'

    return 'Other'
}

// =======================
// BROWSER
// =======================
export function getClientBrowser(ua = '') {
    if (ua.includes('Razer Pedia Digital')) return 'App Razped'
    if (ua.includes('MiuiBrowser')) return 'MiuiBrowser'
    if (ua.includes('Edg')) return 'Edge'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('MSIE') || ua.includes('Trident/7.0')) return 'Internet Explorer'
    if (ua.includes('Netscape')) return 'Netscape'

    return 'Unknown'
}

// =======================
// IP & LOCATION
// =======================
export async function getClientIp() {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip
}

export async function clientIploc(ip) {
    const res = await fetch(`http://www.geoplugin.net/json.gp?ip=${ip}`)
    const data = await res.json()

    return data.geoplugin_city && data.geoplugin_countryCode
        ? `${data.geoplugin_city} ${data.geoplugin_countryCode}`
        : 'Unknown Place'
}

export async function detectedLocation(ip = '') {
    const res = await fetch(`https://ipwho.is/${ip || ''}`)
    return await res.json()
}

// =======================
// QRIS
// =======================
function toCRC16(input) {
    let crc = 0xffff

    for (let i = 0; i < input.length; i++) {
        crc ^= input.charCodeAt(i) << 8
        for (let j = 0; j < 8; j++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
        }
    }

    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

function pad(number) {
    return number < 10 ? '0' + number : String(number)
}

export function generateDynamicQRIS(qris, nominal) {
    if (!qris || !nominal) throw new Error('QRIS & nominal wajib diisi')

    let modified = qris.slice(0, -4).replace('010211', '010212')
    let parts = modified.split('5802ID')

    let amount = '54' + pad(nominal.length) + nominal + '5802ID'
    let output = parts[0] + amount + parts[1]

    return output + toCRC16(output)
}

// =======================
// INVOICE
// =======================
function random(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function generateInvoiceNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `INV${date}${random(8)}`
}

export function getDueTime(hours) {
    const now = new Date()
    now.setHours(now.getHours() + hours)

    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
