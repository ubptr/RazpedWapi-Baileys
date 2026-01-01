import connection from '../config/db.js'

// Ambil semua service
export const getAllService = async () => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM services ORDER BY id ASC'
        )
        return rows
    } catch (error) {
        console.error('Error get all services:', error)
        return []
    }
}

// Ambil service by ID
export const getServiceById = async (id) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM services WHERE id = ? LIMIT 1',
            [id]
        )
        return rows[0] || null
    } catch (error) {
        console.error('Error get service by id:', error)
        return null
    }
}
