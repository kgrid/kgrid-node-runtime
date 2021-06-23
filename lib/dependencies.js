const shelljs = require('shelljs');
const installationPath = require('./paths').installationPath

module.exports =
    function (dependencies) {
        let hasError = false;
        for (let key in dependencies) {
            if (dependencies[key].startsWith('http') || dependencies[key].startsWith('https')) {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${installationPath} --no-package-lock ` + dependencies[key]))) {
                    hasError = true;
                }
            } else {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${installationPath} --no-package-lock ` + key))) {
                    hasError = true;
                }
            }
        }
        return hasError;
    }