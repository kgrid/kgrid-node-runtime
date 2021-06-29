const download = require('download')
const path = require('path')
const fs = require('fs-extra')
const localCachePath = require('./paths').localCachePath
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
    let assetURL = new URL(e, baseUrl);
    let aUrl = assetURL.href;
    let filePath = path.dirname(path.join(koAddress, e));
    return (downloadPromise(aUrl, basePath, filePath));
}

function downloadPromise(asset_url, basePath, filePath) {
    return new Promise((resolve, reject) => {
        let filenames = asset_url.split('/');
        let filename = filenames[filenames.length - 1];
        if (path.extname(filename) !== '.zip') {
            basePath = path.join(basePath, filePath);
        }
        let artifactLocalPath = path.join(localCachePath, filePath, filename)
        let artifactShelfPath = path.join(shelfPath, filePath, filename)
        let artifactExistsOnExternalShelf = fs.existsSync(artifactShelfPath) && localCachePath !== shelfPath;
        let artifactShouldBeDownloadedToLocalStorage = !fs.existsSync(artifactLocalPath) || !shouldLoadFromCache();
        let artifactPath = artifactExistsOnExternalShelf ? artifactShelfPath : artifactLocalPath

        if (!artifactExistsOnExternalShelf && artifactShouldBeDownloadedToLocalStorage) {
            download(asset_url, basePath, {'extract': true, 'filename': filename})
                .then(() => {
                    log('debug', "Downloaded Artifact: " + artifactLocalPath);
                    resolve(artifactLocalPath);
                }).catch((error) => {
                log('error', error)
                reject(asset_url)
            });
        } else {
            log('debug', "Found Artifact: " + artifactPath);
            resolve(artifactPath);
        }
    });
}

module.exports = {downloadFiles, shouldLoadFromCache}