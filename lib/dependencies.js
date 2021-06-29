const shelljs = require('shelljs');
const localCachePath = require('./paths').localCachePath

module.exports =
    function (dependencies) {
        let hasError = false;
        for (let key in dependencies) {
            if (dependencies[key].startsWith('http') || dependencies[key].startsWith('https')) {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${localCachePath} --loglevel=error --no-update-notifier --no-package-lock ` + dependencies[key]))) {
                    hasError = true;
                }
            } else {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${localCachePath} --loglevel=error --no-update-notifier --no-package-lock ` + key))) {
                    hasError = true;
                }
            }
        }
        return hasError;
    }