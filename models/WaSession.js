import connection from '../config/db.js'
import { getServiceById } from '../models/Service.js'
// ========================
// GET SESSION BY COLUMN
// ========================
export const getSessionBy = async (column, value) => {
    try {
        const allowed = [
            'id',
            'wid',
            'username',
            'botPhoneNumber',
            'botName',
            'packageName'
        ]

        if (!allowed.includes(column)) {
            throw new Error('Invalid column')
        }

        const [rows] = await connection.execute(
            `SELECT * FROM wa_sessions WHERE ${column} = ?`,
            [value]
        )

        return rows
    } catch (error) {
        console.error('Error getSessionBy:', error)
        return []
    }
}

// ========================
// GET ONE SESSION
// ========================
export const getSession = async (conditions) => {
    try {
        const keys = Object.keys(conditions)
        const values = Object.values(conditions)

        const where = keys.map(k => `${k} = ?`).join(' AND ')

        const [rows] = await connection.execute(
            `SELECT * FROM wa_sessions WHERE ${where} LIMIT 1`,
            values
        )

        return rows[0] || null
    } catch (error) {
        console.error('Error getSession:', error)
        return null
    }
}

// ========================
// GET ALL SESSION
// ========================
export const getAllSession = async () => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM wa_sessions ORDER BY id DESC'
        )
        return rows
    } catch (error) {
        console.error('Error getAllSession:', error)
        return []
    }
}

// ========================
// INSERT SESSION
// ========================
export const insertSessions = async (data, username) => {
    try {
        const { deviceId, deviceName, devicePhone } = data;
        const services = await getServiceById(deviceId);

        const [result] = await connection.execute(
            `INSERT INTO wa_sessions
            (username, packageName,packageDuration, packageExpired, packageStatus, waStatus, botName, botPhoneNumber, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                services.type,
                extractNumberFromDuration(services.duration),
                getPackageExpirationDate(extractNumberFromDuration(services.duration)),
                'Active',
                'Disconnected',
                deviceName,
                devicePhone,
                new Date(),
                new Date()
            ]
        )

        return result.insertId
    } catch (error) {
        console.error('Error insertSessions:', error)
        throw error
    }
}

// ========================
// UPDATE WEBHOOK
// ========================
export const updateWebhook = async (webhook, id) => {
    try {
        const [result] = await connection.execute(
            'UPDATE wa_sessions SET webhook = ? WHERE id = ?',
            [webhook, id]
        )
        return result.affectedRows
    } catch (error) {
        console.error('Error updateWebhook:', error)
        throw error
    }
}
// ========================
// CREATE SESSION (untuk waManager)
// ========================
export const createSession = async ({
    username,
    botName,
    botPhoneNumber,
    service_id
}) => {
    try {
        const [result] = await connection.execute(
            `INSERT INTO wa_sessions
            (username, botName, botPhoneNumber, service_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                username,
                botName,
                botPhoneNumber,
                service_id,
                'Connecting',
                new Date()
            ]
        )

        return result.insertId
    } catch (error) {
        console.error('Error createSession:', error)
        throw error
    }
}
export const updateSession = async (botPhoneNumber, sessionData) => {
    const wid = sessionData.wid ?? null
    const pushname = sessionData.pushname ?? null
    const authData =
        sessionData.authData === undefined
            ? null
            : JSON.stringify(sessionData.authData)

    const status = sessionData.status ?? null

    const query = `
    UPDATE wa_sessions
    SET wid = ?, pushname = ?, authData = ?, waStatus = ?
    WHERE botPhoneNumber = ?
  `

    try {
        const [results] = await connection.execute(query, [
            wid,
            pushname,
            authData,
            status,
            botPhoneNumber
        ])
        return results
    } catch (error) {
        console.error(`❌ Gagal mengupdate sesi untuk ${botPhoneNumber}:`, error)
        throw error
    }
}

// ========================
// UPDATE STATUS SESSION
// ========================
export const updateStatus = async (status, id) => {
    try {
        const [result] = await connection.execute(
            'UPDATE wa_sessions SET status = ? WHERE id = ?',
            [status, id]
        )

        return result.affectedRows
    } catch (error) {
        console.error('Error updateStatus:', error)
        throw error
    }
}
function getPackageExpirationDate(durationInDays) {
    const currentDate = new Date();
    if (isNaN(currentDate.getTime())) {
        console.error('Tanggal saat ini tidak valid:', currentDate);
        return null;
    }

    if (isNaN(durationInDays) || durationInDays <= 0) {
        console.error('Durasi tidak valid:', durationInDays);
        return null;
    }

    currentDate.setDate(currentDate.getDate() + durationInDays);
    if (isNaN(currentDate.getTime())) {
        console.error('Tanggal kadaluarsa tidak valid:', currentDate);
        return null;
    }

    return currentDate;  
}

// Fungsi untuk mengekstrak angka dari durasi dalam format string
function extractNumberFromDuration(durationString) {
    const match = durationString.match(/\d+/);  
    return match ? parseInt(match[0], 10) : 0;  
}