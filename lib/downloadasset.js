const download = require('download')
const path = require('path')
const fs = require('fs-extra')

module.exports = {
    /*
    ** This method downloads the file from the URL
    ** specified in the parameters
    */
    download_files : function(baseUrl, urls, basePath, idPath) {
      let requests = [];
      if(!baseUrl.endsWith('/')) {
        baseUrl = baseUrl + '/';
      }
      if(Array.isArray(urls)){
        urls.forEach(function(e) {
          requests.push(constructPathsAndDownload(idPath, e, baseUrl, basePath));
        });
      } else {
        requests.push(constructPathsAndDownload(idPath, urls, baseUrl, basePath));
      }
      return requests;
    },
    cleanup: function(basePath, idPath){
      fs.removeSync(path.join(basePath, idPath));
    }
};

function constructPathsAndDownload(idPath, e, baseUrl, basePath) {
  let filePath = idPath;
  let aUrl = "";
  let  assetURL = new URL(e, baseUrl);
  aUrl = assetURL.href;
  filePath = path.dirname(path.join(idPath, e));
  return (downloadPromise(aUrl, basePath, filePath));
}

function downloadPromise (asset_url, basePath, filePath) {
  return new Promise((resolve, reject) => {
    let filenames = asset_url.split('/');
    let filename = filenames[filenames.length-1];
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
