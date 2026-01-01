import { getUserBy } from '../models/User.js'
import { getSession } from '../models/WaSession.js'

export async function verifyApiKey(req, res, next) {
    const { apiKey, deviceName } = req.body

    if (!apiKey || !deviceName) {
        return res.status(403).json({
            status: false,
            message: 'Missing API Key or Device Name'
        })
    }

    try {
        const user = await getUserBy('api_key', apiKey)

        if (!user) {
            return res.status(403).json({
                status: false,
                message: 'Invalid API Key'
            })
        }

        const session = await getSession({
            username: user.username,
            botName: deviceName
        })

        if (!session) {
            return res.status(403).json({
                status: false,
                message: 'Invalid Device or Not Connected'
            })
        }

        req.user = user
        req.session = session
        next()

    } catch (error) {
        console.error('verifyApiKey error:', error)
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        })
    }
}
