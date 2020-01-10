const download = require('download')
const path = require('path')
const fs = require('fs-extra')

module.exports = {

    /*
    ** This method downloads the file
    ** from the URL specified in the
    ** parameters
    */
    download_file : function(url) {
      return new Promise((resolve, reject) => {
        let download_url = url
        let filenames = url.split('/')
        let filename = filenames[filenames.length-1]
        var basePath = './temp'
        fs.ensureDirSync(basePath)
        fs.pathExists(path.join(basePath, filename)).then(exists =>{
          if(exists) {
            resolve(path.join(basePath, filename));
          } else {
            download(download_url, path.join(basePath), "{'extract':true}").then(() => {
              resolve(path.join(basePath, filename));
            });
          }
        })
      })
    }
}
