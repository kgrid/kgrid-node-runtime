function log(level, message) {
    switch (level) {
        case 'debug':
            if (process.env.DEBUG) {
                console.debug(new Date(), message)
            }
            return
        case 'info':
            console.info(new Date(), message)
            return
        case 'warn':
            console.warn(new Date(), message)
            return
        case 'error':
            console.error(new Date(), message)
            return
        default:
            console.warn(new Date(), level, message)
    }
}

module.exports = log;
