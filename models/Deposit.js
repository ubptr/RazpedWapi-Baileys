import connection from '../config/db.js';
import { getServiceById } from '../models/Service.js';
import {
    generateInvoiceNumber,
    getDueTime,
    generateDynamicQRIS
} from '../helpers.js';
import { randomInt } from 'crypto';

// ================= GET ALL DEPOSIT =================
export const getAllDeposit = async () => {
    try {
        const [rows] = await connection.execute('SELECT * FROM deposit');
        return rows.length > 0 ? rows : null;
    } catch (error) {
        console.error('Error fetching Deposits:', error);
        throw error;
    }
};

// ================= GET DEPOSIT BY ID =================
export const getDepositById = async (id) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM deposit WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            throw new Error('Deposit not found');
        }
        return rows[0];
    } catch (error) {
        console.error('Error fetching Deposit by ID:', error);
        throw error;
    }
};

// ================= GET DEPOSIT BY COLUMN =================
export const getDepositBy = async (column, value) => {
    try {
        const validColumns = ['id', 'username', 'type', 'status'];
        if (!validColumns.includes(column)) {
            throw new Error('Invalid column name');
        }

        const query = `SELECT * FROM deposit WHERE ${column} = ?`;
        const [rows] = await connection.execute(query, [value]);
        return rows;
    } catch (error) {
        console.error('Error fetching Deposit by column:', error);
        throw error;
    }
};

// ================= GET DEPOSIT BY CONDITIONS =================
export const getDeposit = async (conditions) => {
    try {
        if (typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
            throw new Error('Invalid conditions object');
        }

        const validColumns = ['username', 'status', 'no_invoice'];

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
            `SELECT * FROM deposit WHERE ${whereQuery}`,
            values
        );

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching Deposit:', error.message);
        throw error;
    }
};

// ================= INSERT DEPOSIT =================
export const insertDeposits = async (servData, username, method, inv) => {
    try {
        let { amount } = servData;
        let trans = amount;
        let get_saldo = amount * method.rate;

        let unik = null;
        if (method.type !== 'Pulsa Transfer' && method.rate === 1) {
            unik = randomInt(100, 999);
            trans += unik;
            get_saldo = trans * method.rate;
        }

        let dynamicQRIS = null;
        if (method.type === 'Qris' && method.merchant === 'MANUAL') {
            dynamicQRIS = generateDynamicQRIS(method.qrcode, amount);
        }

        const [result] = await connection.execute(
            `INSERT INTO deposit 
            (no_invoice, username, provider, payment, system, code_unik, amount, get_saldo, note, rate, qrcode, status, due_date, date, time, merchant, platform)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                inv,
                username,
                method.provider,
                method.payment,
                method.system,
                unik,
                amount,
                get_saldo,
                'Silahkan Transfer!',
                method.rate,
                dynamicQRIS,
                'Pending',
                getDueTime(5),
                new Date(),
                new Date(),
                method.merchant,
                'Website'
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('Error creating Deposits:', error);
        throw error;
    }
};

// ================= UPDATE DEPOSIT =================
export const updateDeposit = async (botPhoneNumber, DepositData) => {
    const { wid, pushname, authData, status } = DepositData;
    const authd = authData ? JSON.stringify(authData) : null;

    const query = `
        UPDATE deposit
        SET wid = ?, pushname = ?, authData = ?, waStatus = ?
        WHERE botPhoneNumber = ?
    `;

    try {
        const [results] = await connection.execute(query, [
            wid,
            pushname,
            authd,
            status,
            botPhoneNumber
        ]);
        return results;
    } catch (error) {
        console.error(`Gagal update deposit ${botPhoneNumber}:`, error);
        throw error;
    }
};
