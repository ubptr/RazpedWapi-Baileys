import connection from '../config/db.js'
import {
    getDevices,
    detectedLocation,
    getClientIp,
    getClientBrowser
} from '../helpers.js'

// ==========================
// Get Log By ID
// ==========================
export const getLogsById = async (id) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM logs WHERE id = ?',
            [id]
        )

        if (rows.length === 0) {
            throw new Error('Data not found')
        }

        return rows[0]
    } catch (error) {
        console.error('Error fetching data by ID:', error)
        throw error
    }
}

// ==========================
// Insert Logs
// ==========================
export const insertLogs = async (type, username, userAgentFromClient) => {
    try {
        // Detect location
        const location = await detectedLocation()

        // Get IP client
        const ip = await getClientIp()

        // User agent (dari client / request)
        const userAgent = userAgentFromClient || 'Unknown'

        // Detect device & browser
        const device = await getDevices(userAgent)
        const browser = await getClientBrowser(userAgent)

        const [result] = await connection.execute(
            `INSERT INTO logs 
            (username, type, ip_static, user_agent, device, \`browser\`, city, country, latitude, longitude, date, time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                type,
                ip,
                userAgent,
                device,
                browser,
                `${location.city} - ${location.region}`,
                `${location.country} ${location.country_code}`,
                location.latitude,
                location.longitude,
                new Date(),
                new Date()
            ]
        )

        return result.insertId
    } catch (error) {
        console.error('Error inserting log:', error)
        throw error
    }
}
