let express = require('express');
const downloadasset = require('../lib/downloadasset');
let fs = require('fs-extra');
const path = require('path');
const shelljs = require('shelljs');
const executor = require('../lib/executor');
let router = express.Router();

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

router.get('/endpoints', function (req, res) {
    let epArray = [];
    for (let key in global.cxt.map) {
        let endpoint = global.cxt.map[key];
        epArray.push({
            "uri": req.app.locals.info.url + '/' + key,
            "id": endpoint.id,
            "activated": endpoint.activated,
            "status": endpoint.status
        });
    }
    res.send(epArray);
});

router.get('/endpoints/:naan/:name/:version/:endpoint', function (req, res) {
    let uri = req.params.naan + "/" + req.params.name + "/" + req.params.version + "/" + req.params.endpoint;
    let key = endpointHash(uri);
    let endpoint = global.cxt.map[key];
    res.send({
        "uri": req.app.locals.info.url + '/' + key,
        "id": endpoint.id,
        "activated": endpoint.activated,
        "status": endpoint.status
    });
});

/* POST a deployment descriptor to activate */
router.post('/endpoints', function (req, res) {
    console.log(req.body);
    let targetpath = req.app.locals.shelfPath;
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
        downloadasset.cleanup(targetpath, idPath);
        Promise.all(downloadasset.download_files(baseUrl, req.body.artifact, targetpath, idPath)).then(function (artifacts) {
            artifacts.forEach(function (artifact) {
                let packageFile = path.basename(artifact);
                if (packageFile === "package.json") {
                    console.log(packageFile);
                    let pkgJson = require(path.join(targetpath, idPath, packageFile));
                    let dep = pkgJson.dependencies;
                    if (dep) {
                        console.log(dep);
                        installDependencies(targetpath, dep);
                    }
                }
            });
            // Construct the Executor
            let entryFile = (baseUrl === "") ? targetpath + '/' + idPath + '/' + path.basename(req.body.entry)
                : path.join(targetpath, idPath, req.body.entry);
            let exec = Object.create(executor);
            try {
                global.cxt.map[idPath] = {status: 'Uninitialized'}
                exec.init(entryFile)
                global.cxt.map[idPath] = {
                    src: entryFile,
                    executor: exec,
                    activated: result.activated,
                    id: id,
                    status: status
                };
                fs.writeJSONSync(path.join(req.app.locals.shelfPath, 'context.json'), global.cxt.map, {spaces: 4});
                res.json(result);
            } catch (error) {
                console.log(error)
                downloadasset.cleanup(targetpath, idPath);
                global.cxt.map[idPath].status = error.message;
                res.status(400).send({"description": "Cannot create executor." + error, "stack": error.stack});
            }
        })
            .catch(function (errors) {
                setTimeout(function () {
                    downloadasset.cleanup(targetpath, idPath);
                    global.cxt.map[idPath].status = errors;
                    res.status(404).send({"description": 'Cannot download ' + errors});
                }, 500);
            });
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
        processEndpointwithGlobalCxtExecutor(req.params.endpointHash, req.body).then(function (output) {
            output.request_id = req.id;
            res.send(output);
        }).catch(function (error) {
            res.status(400).send({"description": error});
        });
    } else {
        res.status(404).send({"description": 'Cannot found the endpoint: ' + req.params.endpointHash});
    }
});

function installDependencies(targetpath, dependencies) {
    shelljs.cd(targetpath);
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

function processEndpointwithGlobalCxtExecutor(key, input) {
    let func = global.cxt.getExecutorByHash(key);
    let output = {};
    return new Promise((resolve, reject) => {
        func.execute(input).then(function (data) {
            output.result = data;
            resolve(output);
        }).catch(error => {
            console.log(error);
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

module.exports = {router, endpointhash: endpointHash};
