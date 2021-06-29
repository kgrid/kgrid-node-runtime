module.exports = {
    func: () => {
    },
    async: false,
    init(file) {
        delete require.cache[require.resolve(file)]
        this.func = require(file)
        if (this.func.constructor.name === "AsyncFunction") {
            this.async = true
        }
    },
    execute(input) {
        if (this.async) {
            return new Promise((resolve, reject) => {
                this.func(input).then(function (data) {
                    resolve(data)
                }).catch((error) => {
                    reject(error)
                });
            })
        } else {
            return new Promise((resolve, reject) => {
                try {
                    resolve(this.func(input))
                } catch (error) {
                    reject(error)
                }
            })
        }
    },
    isAsync() {
        return this.async
    }
};
