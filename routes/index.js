let express = require('express');
const downloadAsset = require('../lib/downloadasset');
let fs = require('fs-extra');
const path = require('path');
const shelljs = require('shelljs');
const executor = require('../lib/executor');
let router = express.Router();
const axios = require('axios').default;
let configJSON = require('./../appProperties.json');
const pjson = require('./../package.json');
const log = require('../lib/logger')
let kgridProxyAdapterUrl = process.env.KGRID_PROXY_ADAPTER_URL || configJSON.kgrid_proxy_adapter_url;
const environmentSelfUrl = process.env.KGRID_NODE_ENV_URL || configJSON.kgrid_node_env_url;

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'KGrid Node Runtime', tagline: 'Running Knowledge Objects written in JavaScript'});
});

/* GET INFO */
router.get('/info', function (req, res) {
    res.send(req.app.locals.info);
});

router.get('/context', function (req, res) {
    res.send(global.cxt);
});

router.get('/register', function (req, res) {
    registerWithActivator(req.app, true);
    res.send({"Registered with": kgridProxyAdapterUrl});
});

router.get('/endpoints', function (req, res) {
    let epArray = [];
    for (let key in global.cxt.map) {
        let endpoint = global.cxt.map[key];
        let baseUrl = req.app.locals.info.url;
        let url;
        if (baseUrl.endsWith('/')) {
            url = baseUrl + key;
        } else {
            url = baseUrl + '/' + key;
        }
        epObj = {
            "id": endpoint.id,
            "activated": endpoint.activated,
            "status": endpoint.status
        }
        if (endpoint.status === "Activated") {
            epObj.url = url;
        }
        epArray.push(epObj);
    }
    res.send(epArray);
});

router.get('/endpoints/:naan/:name/:version/:endpoint', function (req, res) {
    let uri = req.params.naan + "/" + req.params.name + "/" + req.params.version + "/" + req.params.endpoint;
    let key = endpointHash(uri);
    let endpoint = global.cxt.map[key];
    let baseUrl = req.app.locals.info.url;
    let url;
    if (baseUrl.endsWith('/')) {
        url = baseUrl + key;
    } else {
        url = baseUrl + '/' + key;
    }
    epObj = {
        "id": endpoint.id,
        "activated": endpoint.activated,
        "status": endpoint.status
    }
    if (endpoint.status === "Activated") {
        epObj.url = url;
    }
    res.send(epObj);
});

/* POST a deployment descriptor to activate */
router.post('/endpoints', function (req, res) {
    log('debug',req.body);
    let targetPath = req.app.locals.shelfPath;
    let id = "";
    let baseUrl = "";
    let idPath;
    if (invalidInput(req.body)) {
        res.status(400).send({"description": "Bad Request"});
    } else {
        // Download resources
        let status = "Activated";
        id = req.body.uri;
        idPath = endpointHash(id);
        baseUrl = req.body.baseUrl || "";
        let result = {};
        result.id = id;
        result.uri = idPath;
        result.activated = (new Date()).toString();
        result.status = status
        if (global.cxt.map[idPath] === undefined) {
            global.cxt.map[idPath] = {'isProcessing': true}
            activateEndpoint(targetPath, idPath, baseUrl, req, id, res, result);
        } else {
            if (process.env.KGRID_NODE_CACHE_STRATEGY === "always") {
                res.json(result);
            } else if (process.env.KGRID_NODE_CACHE_STRATEGY === "use_checksum" && global.cxt.map[idPath].checksum
                && global.cxt.map[idPath].checksum === req.body.checksum) {
                res.json(result);
            } else if (global.cxt.map[idPath].isProcessing) {
                result.status = 'Endpoint is in processing, try again later.';
                res.status(503).json(result);
            } else {
                global.cxt.map[idPath].isProcessing = true;
                activateEndpoint(targetPath, idPath, baseUrl, req, id, res, result)
            }
        }
    }
});

/* POST dependencies to install*/
router.post('/dependencies', function (req, res) {
    let targetPath = req.app.locals.shelfPath;
    fs.ensureDirSync(targetPath);
    if (req.body.dependencies) {
        let hasError = installDependencies(targetPath, req.body.dependencies);
        if (hasError) {
            res.status(400).send({"description": "Failed installing dependencies"});
        } else {
            res.send({"Info": "Dependencies installed."});
        }
    } else {
        res.status(400).send({"description": "No dependency specified."});
    }
});

router.get('/mem', function (req, res) {
    res.send(process.memoryUsage());
});

router.post('/:endpointHash', function (req, res) {
    if (global.cxt.map[req.params.endpointHash]) {
        processEndpointWithGlobalCxtExecutor(req.params.endpointHash, req.body).then(function (output) {
            output.request_id = req.id;
            res.send(output);
        }).catch(function (error) {
            res.status(400).send({"description": error});
        });
    } else {
        res.status(404).send({"description": 'Cannot found the endpoint: ' + req.params.endpointHash});
    }
});

function installDependencies(targetPath, dependencies) {
    shelljs.cd(targetPath);
    let hasError = false;
    for (let key in dependencies) {
        if (dependencies[key].startsWith('http') || dependencies[key].startsWith('https')) {
            if (shelljs.error(shelljs.exec('npm install --save ' + dependencies[key]))) {
                hasError = true;
            }
        } else {
            if (shelljs.error(shelljs.exec('npm install --save ' + key))) {
                hasError = true;
            }
        }
    }
    return hasError;
}

function processEndpointWithGlobalCxtExecutor(key, input) {
    let func = global.cxt.getExecutorByHash(key);
    let output = {};
    return new Promise((resolve, reject) => {
        func.execute(input).then(function (data) {
            output.result = data;
            resolve(output);
        }).catch(error => {
            log('warn',error);
            reject(error);
        });
    });
}

function endpointHash(uri) {
    let hash = 0, i, chr;
    for (i = 0; i < uri.length; i++) {
        chr = uri.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash + "";
}

function invalidInput(obj) {
    return !(obj.artifact && obj.entry && obj.uri && obj.artifact !== "")
}

function registerWithActivator(app, forceUpdate) {
    if (kgridProxyAdapterUrl.endsWith("/")) {
        kgridProxyAdapterUrl = kgridProxyAdapterUrl.substr(0, kgridProxyAdapterUrl.length - 1);
    }
    let reqBody = {};
    reqBody.engine = 'node';
    reqBody.version = pjson.version
    reqBody.url = environmentSelfUrl
    reqBody.contextKeys = Object.keys(global.cxt.map);
    reqBody.forceUpdate = forceUpdate;
    axios.post(kgridProxyAdapterUrl + "/proxy/environments",
        reqBody)
        .then(function (response) {
            log(
                'debug',
                `Registered remote environment in activator at ${kgridProxyAdapterUrl} 
                with response: ${JSON.stringify(response.data)}`)
            app.locals.info.activatorUrl = kgridProxyAdapterUrl;
        })
        .catch(function (error) {
            if (error.response) {
                log('warn',error.response.data);
            } else {
                log('warn',error.message);
            }
        });
}


function activateEndpoint(targetPath, idPath, baseUrl, req, id, res, result) {
    downloadAsset.cleanup(targetPath, idPath);
    Promise.all(downloadAsset.download_files(baseUrl, req.body.artifact, targetPath, idPath))
        .then(function (artifacts) {
            artifacts.forEach(function (artifact) {
                let packageFile = path.basename(artifact);
                if (packageFile === "package.json") {
                    log('debug',packageFile);
                    let pkgJson = require(path.join(targetPath, idPath, packageFile));
                    let dep = pkgJson.dependencies;
                    if (dep) {
                        log('debug',dep);
                        installDependencies(targetPath, dep);
                    }
                }
            });

            let entryFile = path.join(targetPath, idPath, req.body.entry);
            let endpoint = {
                entry: entryFile,
                executor: null,
                activated: new Date(),
                id: id,
                status: 'Not Activated',
                checksum: req.body.checksum
            }

            try {
                let exec = Object.create(executor);
                exec.init(entryFile);
                endpoint.executor = exec;
                endpoint.status = 'Activated';

                res.json(result);
            } catch (error) {
                log('warn',error)
                downloadAsset.cleanup(targetPath, idPath);
                endpoint.status = error.message
                res.status(400).send({"description": "Cannot create executor." + error, "stack": error.stack});
            } finally {
                global.cxt.map[idPath] = endpoint
                global.cxt.map[idPath].isProcessing = false
                fs.writeJSONSync(path.join(req.app.locals.shelfPath, 'context.json'), global.cxt.map, {spaces: 4});
            }
        })
        .catch(function (errors) {
            setTimeout(function () {
                downloadAsset.cleanup(targetPath, idPath);
                global.cxt.map[idPath] = {
                    executor: null,
                    activated: new Date(),
                    id: id,
                    status: errors,
                    isProcessing: false
                };
                fs.writeJSONSync(path.join(req.app.locals.shelfPath, 'context.json'), global.cxt.map, {spaces: 4});
                res.status(404).send({"description": 'Cannot download ' + errors});
            }, 500);
        });
}

module.exports = {router, endpointHash: endpointHash, registerWithActivator};
