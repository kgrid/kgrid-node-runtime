const shelljs = require('shelljs');
const shelfPath = require('./paths').shelfPath
const nodePath = require('./paths').nodePath
module.exports =
    function (dependencies) {
        shelljs.cd(shelfPath);
        let hasError = false;
        for (let key in dependencies) {
            if (dependencies[key].startsWith('http') || dependencies[key].startsWith('https')) {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${nodePath} --no-package-lock ` + dependencies[key]))) {
                    hasError = true;
                }
            } else {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${nodePath} --no-package-lock ` + key))) {
                    hasError = true;
                }
            }
        }
        return hasError;
    }