const shelljs = require('shelljs');
const path = require('path');
const shelfPath = require('./paths').shelfPath
const installationPath = require('./paths').installationPath
const moduleParentPath = path.dirname(installationPath)

module.exports =
    function (dependencies) {
        shelljs.cd(shelfPath);
        let hasError = false;
        for (let key in dependencies) {
            if (dependencies[key].startsWith('http') || dependencies[key].startsWith('https')) {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${moduleParentPath} --no-package-lock ` + dependencies[key]))) {
                    hasError = true;
                }
            } else {
                if (shelljs.error(shelljs.exec(`npm install --prefix ${moduleParentPath} --no-package-lock ` + key))) {
                    hasError = true;
                }
            }
        }
        return hasError;
    }