import connection from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

// ==========================
// Get User By ID
// ==========================
export const getUserById = async (id) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        )

        if (rows.length === 0) {
            throw new Error('User not found')
        }

        return rows[0]
    } catch (error) {
        console.error('Error fetching user by ID:', error)
        throw error
    }
}

// ==========================
// Get User By Column
// ==========================
export const getUserBy = async (column, value) => {
    try {
        const validColumns = ['id', 'username', 'email', 'phone', 'api_key']
        if (!validColumns.includes(column)) {
            throw new Error('Invalid column name')
        }

        const query = `SELECT * FROM users WHERE ${column} = ?`
        const [rows] = await connection.execute(query, [value])

        return rows[0]
    } catch (error) {
        console.error('Error fetching user by column:', error)
        throw error
    }
}

// ==========================
// Update User
// ==========================
export const updateUserBy = async (updates, conditions) => {
    try {
        if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
            throw new Error('Invalid updates object')
        }

        if (!conditions || typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
            throw new Error('Invalid conditions object')
        }

        const setQuery = Object.keys(updates)
            .map(key => key === 'usage' ? `\`${key}\` = ?` : `${key} = ?`)
            .join(', ')

        const whereQuery = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ')

        const query = `UPDATE users SET ${setQuery} WHERE ${whereQuery}`
        const values = [...Object.values(updates), ...Object.values(conditions)]

        const [result] = await connection.execute(query, values)
        return result.affectedRows
    } catch (error) {
        console.error('Error updating user:', error)
        throw error
    }
}

// ==========================
// Create User
// ==========================
export const createUser = async (userData) => {
    try {
        const { fullName, username, phone, password, email } = userData

        if (!email || !password || !fullName || !username || !phone) {
            throw new Error('Semua kolom harus diisi')
        }

        const apiKey = uuidv4()
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const [result] = await connection.execute(
            `INSERT INTO users 
            (name, username, email, phone, password, balance, \`usage\`, level, status, code_verifikasi, status_api, api_key, ip_static, uplink, register_at, read_news, random_token, remember_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fullName,
                username,
                email,
                phone,
                hashedPassword,
                0,
                0,
                'Basic',
                'Active',
                '-',
                'Inactive',
                apiKey,
                '',
                'Upby Sistem',
                new Date(),
                'false',
                '',
                ''
            ]
        )

        return result.insertId
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}
