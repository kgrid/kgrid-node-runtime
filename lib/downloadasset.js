const download = require('download')
const path = require('path')
const fs = require('fs-extra')

module.exports = {
    /*
    ** This method downloads the file
    ** from the URL specified in the
    ** parameters
    */
    download_files : function(urls, basePath, idpath) {
      let requests = [];
      if(Array.isArray(urls)){
        urls.forEach(function(e) {
          requests.push(downloadPromise(e,basePath, idpath));
        })
      } else {
        requests.push(downloadPromise(urls,basePath, idpath));
      }
      return requests
    }
}

function downloadPromise (asset_url, basePath, idpath) {
  return new Promise((resolve, reject) => {
    let filenames = asset_url.split('/')
    let filename = filenames[filenames.length-1]
    if(path.extname(filename)!='.zip'){
      basePath=path.join(basePath, idpath)
    }
    download(asset_url, basePath, {'extract':true, 'filename':filename})
    .then(() => {
      resolve(asset_url);
    }).catch(()=>{
      reject(asset_url)
    });
  })
}
