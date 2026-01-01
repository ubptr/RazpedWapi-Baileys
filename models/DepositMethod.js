import connection from '../config/db.js';
import { getServiceById } from '../models/Service.js';

// ================= GET ALL METHOD =================
export const getAllMethod = async () => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM deposit_method'
        );
        return rows.length > 0 ? rows : null;
    } catch (error) {
        console.error('Error fetching Methods:', error);
        throw error;
    }
};

// ================= GET METHOD BY ID =================
export const getMethodById = async (id) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM deposit_method WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            throw new Error('Method not found');
        }

        return rows[0];
    } catch (error) {
        console.error('Error fetching Method by ID:', error);
        throw error;
    }
};

// ================= GET METHOD BY COLUMN =================
export const getMethodBy = async (column, value) => {
    try {
        const validColumns = [
            'id', 'username', 'type', 'pushname', 'authData',
            'packageName', 'packageDuration', 'packageExpired',
            'packageStatus', 'waStatus', 'botName', 'botPhoneNumber',
            'personalWebhookUrl', 'groupWebhookUrl'
        ];

        if (!validColumns.includes(column)) {
            throw new Error('Invalid column name');
        }

        const query = `SELECT * FROM deposit_method WHERE ${column} = ?`;
        const [rows] = await connection.execute(query, [value]);
        return rows;
    } catch (error) {
        console.error('Error fetching Method by column:', error);
        throw error;
    }
};

// ================= GET METHOD BY CONDITIONS =================
export const getMethod = async (conditions) => {
    try {
        if (typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
            throw new Error('Invalid conditions object');
        }

        const validColumns = [
            'username', 'packageName', 'packageDuration',
            'packageExpired', 'packageStatus', 'waStatus',
            'botName', 'botPhoneNumber', 'personalWebhookUrl',
            'groupWebhookUrl', 'created_at', 'updated_at',
            'last_activity', 'is_active'
        ];

        const invalidColumns = Object.keys(conditions).filter(
            key => !validColumns.includes(key)
        );

        if (invalidColumns.length > 0) {
            throw new Error(
                `Invalid column(s): ${invalidColumns.join(', ')}`
            );
        }

        const whereQuery = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');

        const values = Object.values(conditions);

        const [rows] = await connection.execute(
            `SELECT * FROM deposit_method WHERE ${whereQuery}`,
            values
        );

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching Method:', error.message);
        throw error;
    }
};

// ================= INSERT METHOD =================
export const insertMethods = async (servData, username) => {
    try {
        const { deviceId, deviceName, devicePhone } = servData;
        const services = await getServiceById(deviceId);

        const duration = extractNumberFromDuration(services.duration);
        const expired = getPackageExpirationDate(duration);

        const [result] = await connection.execute(
            `INSERT INTO deposit_method
            (username, packageName, packageDuration, packageExpired, packageStatus, waStatus, botName, botPhoneNumber, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                services.type,
                duration,
                expired,
                'Active',
                'Disconnected',
                deviceName,
                devicePhone,
                new Date(),
                new Date()
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('Error creating Methods:', error);
        throw error;
    }
};

// ================= UPDATE METHOD =================
export const updateMethod = async (botPhoneNumber, MethodData) => {
    const { wid, pushname, authData, status } = MethodData;
    const authd = authData ? JSON.stringify(authData) : null;

    const query = `
        UPDATE deposit_method
        SET wid = ?, pushname = ?, authData = ?, waStatus = ?
        WHERE botPhoneNumber = ?
    `;

    try {
        const [results] = await connection.execute(
            query,
            [wid, pushname, authd, status, botPhoneNumber]
        );
        return results;
    } catch (error) {
        console.error(`Gagal mengupdate method ${botPhoneNumber}:`, error);
        throw error;
    }
};

// ================= HELPERS =================
function getPackageExpirationDate(durationInDays) {
    const currentDate = new Date();

    if (isNaN(currentDate.getTime())) return null;
    if (isNaN(durationInDays) || durationInDays <= 0) return null;

    currentDate.setDate(currentDate.getDate() + durationInDays);
    return isNaN(currentDate.getTime()) ? null : currentDate;
}

function extractNumberFromDuration(durationString) {
    const match = durationString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}
