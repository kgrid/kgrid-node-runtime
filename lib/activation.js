const URI = require('uri-js');
const path = require('path');
const executor = require('./executor');
const {downloadFiles} = require('./downloadasset');
const fs = require('fs-extra');
const log = require('./logger')
const installDependencies = require('./dependencies')
const contextFilePath = require('./paths').contextFilePath
const shelfPath = require('./paths').shelfPath
const localCachePath = require('./paths').localCachePath

module.exports = function (baseUrl, id, req, res, result) {
    global.cxt.map[id] = {
        executor: null,
        activated: new Date(),
        id: id,
        status: 'processing',
        isProcessing: true
    };

    let koAddress = URI.parse(baseUrl).path.split("/proxy/artifacts/").pop();
    Promise.all(downloadFiles(baseUrl, req.body.artifact, localCachePath, koAddress))
        .then(function (artifacts) {
            let activationResult = activateArtifacts(artifacts, koAddress, id, req)
            result.status = activationResult.description
            res.status(activationResult.status).json(result)
        })
        .catch(function (errors) {
            setTimeout(function () {
                let errorStatus = 'Cannot download ' + errors;
                global.cxt.map[id] = {
                    executor: null,
                    activated: new Date(),
                    id: id,
                    status: errorStatus,
                    isProcessing: false
                };
                fs.writeJSONSync(contextFilePath, global.cxt.map, {spaces: 4});
                result.status = errorStatus
                res.status(404).json(result)
            }, 500);
        });
    return result;
}


function activateArtifacts(artifacts, koAddress, id, request) {
    let result;
    let entryFile = path.join(shelfPath, koAddress, request.body.entry);
    if (!fs.existsSync(entryFile)) {
        entryFile = path.join(localCachePath, koAddress, request.body.entry);
    }
    artifacts.forEach(function (artifact) {
        log('info', "Artifact Location: " + artifact)
        let packageFile = path.basename(artifact);
        if (packageFile === "package.json") {
            log('info', packageFile);
            let pkgJson = require(artifact);
            let dependencies = pkgJson.dependencies;
            if (dependencies) {
                log('info', dependencies);
                installDependencies(dependencies);
            }
        }
    });

    let endpoint = {
        entry: entryFile,
        executor: null,
        activated: new Date(),
        id: id,
        status: 'Not Activated',
        checksum: request.body.checksum
    }

    try {
        let exec = Object.create(executor);
        exec.init(entryFile);
        endpoint.executor = exec;
        endpoint.status = 'Activated';

        log('info', `Successfully deployed endpoint: ${endpoint.id}`);
        log('debug', request.body);
        result = {
            status: 200,
            description: ' Success'
        }
    } catch (error) {
        log('warn', error.message)
        log('debug', error);
        endpoint.status = error.message
        result = {
            status: 400,
            description: " Cannot create executor." + error, "stack": error.stack
        }
    } finally {
        global.cxt.map[id] = endpoint
        global.cxt.map[id].isProcessing = false
        fs.writeJSONSync(contextFilePath, global.cxt.map, {spaces: 4});
    }
    return result;
}