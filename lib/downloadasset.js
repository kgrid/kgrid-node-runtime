const download = require('download')
const path = require('path')
const fs = require('fs-extra')

module.exports = {
    /*
    ** This method downloads the file from the URL
    ** specified in the parameters
    */
    download_files : function(baseUrl, urls, basePath, idPath) {
      var requests = [];
      var assetURL = null;
      var aUrl = "";
      if(Array.isArray(urls)){
        urls.forEach(function(e) {
          var filePath = idPath;
          if(baseUrl){
            if(!baseUrl.endsWith('/')){
              baseUrl=baseUrl+'/';
            }
            assetURL = new URL(e, baseUrl);
            aUrl=assetURL.href;
            filePath = path.dirname(path.join(idPath, e.replace(baseUrl,"")));
          } else {
            aUrl = e;
          }
          requests.push(downloadPromise(aUrl,basePath, filePath));
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

function downloadPromise (asset_url, basePath, filePath) {
  return new Promise((resolve, reject) => {
    var filenames = asset_url.split('/');
    var filename = filenames[filenames.length-1];
    if(path.extname(filename)!='.zip'){
      basePath=path.join(basePath, filePath);
    }
    download(asset_url, basePath, {'extract':true, 'filename':filename})
    .then(() => {
      resolve(asset_url);
    }).catch(()=>{
      reject(asset_url)
    });
  });
}
