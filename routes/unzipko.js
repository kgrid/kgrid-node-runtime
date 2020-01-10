const admzip = require('adm-zip')
const fs = require('fs-extra')

function unzipko(file, target) {
  var zip = new admzip(file)
  fs.ensureDirSync(target)
  zip.extractAllTo(target, true)

}

module.exports = unzipko
