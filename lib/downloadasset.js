const download = require('download')
const path = require('path')
const fs = require('fs-extra')
const shelfPath = require('./paths').shelfPath
const logger = require('./logger')
module.exports = {
    /*
    ** This method downloads the file from the URL
    ** specified in the parameters
    */
    download_files : function(baseUrl, urls, basePath, koAddress) {
      let requests = [];
      if(!baseUrl.endsWith('/')) {
        baseUrl = baseUrl + '/';
      }
      if(Array.isArray(urls)){
        urls.forEach(function(e) {
          requests.push(constructPathsAndDownload(koAddress, e, baseUrl, basePath));
        });
      } else {
        requests.push(constructPathsAndDownload(koAddress, urls, baseUrl, basePath));
      }
      return requests;
    }
};

function constructPathsAndDownload(koAddress, e, baseUrl, basePath) {
  let filePath = koAddress;
  let aUrl = "";
  let  assetURL = new URL(e, baseUrl);
  aUrl = assetURL.href;
  filePath = path.dirname(path.join(koAddress, e));
  return (downloadPromise(aUrl, basePath, filePath));
}

function downloadPromise (asset_url, basePath, filePath) {
  return new Promise((resolve, reject) => {
    let filenames = asset_url.split('/');
    let filename = filenames[filenames.length-1];
    if(path.extname(filename)!='.zip'){
      basePath=path.join(basePath, filePath);
    }
    let artifactName = path.join(shelfPath,filePath,filename)
    if(fs.existsSync(artifactName)){
      logger('debug',"Found Artifact: " + artifactName);
      resolve(artifactName);
    } else {
      download(asset_url, basePath, {'extract': true, 'filename': filename})
          .then(() => {
            logger('debug',"Downloaded Artifact: " + artifactName);
            resolve(asset_url);
          }).catch((error) => {
            console.log(error)
            reject(asset_url)
          });
    }
  });
}
