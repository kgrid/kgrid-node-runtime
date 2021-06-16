const shelljs = require('shelljs');
const shelfPath = require('./paths').shelfPath

module.exports =
    function (dependencies) {
        shelljs.cd(shelfPath);
        let hasError = false;
        for (let key in dependencies) {
            if (dependencies[key].startsWith('http') || dependencies[key].startsWith('https')) {
                if (shelljs.error(shelljs.exec('npm install --save ' + dependencies[key]))) {
                    hasError = true;
                }
            } else {
                if (shelljs.error(shelljs.exec('npm install --save ' + key))) {
                    hasError = true;
                }
            }
        }
        return hasError;
    }