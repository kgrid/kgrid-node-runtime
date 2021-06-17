const shelljs = require('shelljs');
const path = require('path');
const shelfPath = require('./paths').shelfPath
const nodePath = require('./paths').nodePath
const moduleParentPath = path.dirname(nodePath)
module.exports =
    function (dependencies) {
        console.log(" **************  Node Path: "+ nodePath)
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