const download = require('download')
const path = require('path')
const fs = require('fs-extra')

module.exports = {
    /*
    ** This method downloads the file from the URL
    ** specified in the parameters
    */
    download_files : function(urls, basePath, idPath) {
      var requests = [];
      if(Array.isArray(urls)){
        urls.forEach(function(e) {
          requests.push(downloadPromise(e,basePath, idPath));
        });
      } else {
        requests.push(downloadPromise(urls,basePath, idPath));
      }
      return requests;
    },
    cleanup: function(basePath, idPath){
      fs.removeSync(path.join(basePath, idPath));
    }
};

function downloadPromise (asset_url, basePath, idPath) {
  return new Promise((resolve, reject) => {
    var filenames = asset_url.split('/');
    var filename = filenames[filenames.length-1];
    if(path.extname(filename)!='.zip'){
      basePath=path.join(basePath, idPath);
    }
    download(asset_url, basePath, {'extract':true, 'filename':filename})
    .then(() => {
      resolve(asset_url);
    }).catch(()=>{
      reject(asset_url)
    });
  });
}
