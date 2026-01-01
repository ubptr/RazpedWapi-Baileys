// models/WebSetting.js
import pool from '../config/db.js'

export async function getWebSettingById() {
    const sql = 'SELECT * FROM web_setting WHERE id = 1'
    const [rows] = await pool.query(sql)
    return rows[0]
}
