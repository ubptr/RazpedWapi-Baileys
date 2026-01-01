import connection from '../config/db.js'
import {
    getDevices,
    detectedLocation,
    getClientIp,
    getClientBrowser
} from '../helpers.js'

// =========================
// GET HISTORY SALDO BY ID
// =========================
export const getHistorySaldoById = async (id) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM history_saldo WHERE id = ?',
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

// =========================
// INSERT HISTORY SALDO
// =========================
export const insertHistorySaldo = async (type, user, qty, msg) => {
    try {
        let saldoAfter

        if (type === 'Debit') {
            saldoAfter = user.balance - qty
        } else {
            saldoAfter = user.balance + qty
        }

        const [result] = await connection.execute(
            `INSERT INTO history_saldo
            (username, type, quantity, saldo_before, saldo_after, msg, date, time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.username,
                type,
                qty,
                user.balance,
                saldoAfter,
                msg,
                new Date(),
                new Date()
            ]
        )

        return result.insertId
    } catch (error) {
        console.error('Error inserting history saldo:', error)
        throw error
    }
}
