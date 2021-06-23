const download = require('download')
const path = require('path')
const fs = require('fs-extra')
const shelfPath = require('./paths').shelfPath
const log = require('./logger')

function downloadFiles(baseUrl, urls, basePath, koAddress) {
    let requests = [];
    if (!baseUrl.endsWith('/')) {
        baseUrl = baseUrl + '/';
    }
    if (Array.isArray(urls)) {
        urls.forEach(function (e) {
            requests.push(constructPathsAndDownload(koAddress, e, baseUrl, basePath));
        });
    } else {
        requests.push(constructPathsAndDownload(koAddress, urls, baseUrl, basePath));
    }
    return requests;
}

function shouldLoadFromCache() {
    let loadFromCache = process.env.KGRID_NODE_LOAD_FROM_CACHE
        ? process.env.KGRID_NODE_LOAD_FROM_CACHE.toLowerCase()
        : false;
    return JSON.parse(loadFromCache)
}

function constructPathsAndDownload(koAddress, e, baseUrl, basePath) {
    let aUrl = "";
    let assetURL = new URL(e, baseUrl);
    aUrl = assetURL.href;
    let filePath = path.dirname(path.join(koAddress, e));
    return (downloadPromise(aUrl, basePath, filePath));
}

function downloadPromise(asset_url, basePath, filePath) {
    return new Promise((resolve, reject) => {
        let filenames = asset_url.split('/');
        let filename = filenames[filenames.length - 1];
        if (path.extname(filename) != '.zip') {
            basePath = path.join(basePath, filePath);
        }
        let artifactName = path.join(shelfPath, filePath, filename)
        if (fs.existsSync(artifactName) && shouldLoadFromCache()) {
            log('debug', "Found Artifact: " + artifactName);
            resolve(artifactName);
        } else {
            download(asset_url, basePath, {'extract': true, 'filename': filename})
                .then(() => {
                    log('debug', "Downloaded Artifact: " + artifactName);
                    resolve(asset_url);
                }).catch((error) => {
                log('error', error)
                reject(asset_url)
            });
        }
    });
}

module.exports = {downloadFiles, shouldLoadFromCache}