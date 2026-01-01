import { getWebSettingById } from '../models/WebSetting.js'

const webSettingsMiddleware = async (req, res, next) => {
    try {
        const settings = await getWebSettingById()

        // bisa dipakai di EJS: webSettings.title, dll
        res.locals.webSettings = settings || {}

        next()
    } catch (error) {
        console.error('Error fetching web settings:', error)
        next(error)
    }
}

export default webSettingsMiddleware
