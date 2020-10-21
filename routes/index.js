var express = require('express');
const downloadasset = require('../lib/downloadasset');
var fs = require('fs-extra');
const path = require('path');
const shelljs = require('shelljs');
const executor = require('../lib/executor');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'KGrid Node Runtime', tagline: 'Running Knowledge Objects written in JavaScript'});
});

/* GET INFO */
router.get('/info', function (req, res, next) {
    res.send(req.app.locals.info);
});

router.get('/context', function (req, res, next) {
    res.send(global.cxt);
});

router.get('/endpoints', function (req, res, next) {
    var epArray = [];
    for (var key in global.cxt.map) {
        epArray.push(req.app.locals.info.appUrl + '/' + key);
    }
    res.send(epArray);
});

router.post('/endpoints', function (req, res, next) {
    var keyArray = [];
    var output = {removed: [], nonexisting: []};
    if (req.body.clearAll) {
        keyArray = JSON.parse(JSON.stringify(Object.keys(global.cxt.map)));
    } else {
        keyArray = (req.body.keys != null) ? JSON.parse(JSON.stringify(req.body.keys)) : [];
    }
    keyArray.forEach(function (e) {
        if (global.cxt.map[e]) {
            delete global.cxt.map[e];
            downloadasset.cleanup(req.app.locals.shelfPath, e);
            fs.writeJSONSync(path.join(req.app.locals.shelfPath, 'context.json'), global.cxt.map, {spaces: 4});
        } else {

        }
    });
    res.send(keyArray);
});

/* POST a deployment descriptor to activate */
router.post('/deployments', function (req, res, next) {
    console.log(req.body);
    var targetpath = req.app.locals.shelfPath;
    var id = "";
    var baseUrl = "";
    if (invalidInput(req.body)) {
        res.status(400).send({"Error": "Bad Request"});
    } else {
        // Download resources
        id = req.body.uri;
        idPath = endpointhash(id);
        baseUrl = req.body.baseUrl || "";
        var result = {};
        result.endpointUrl = idPath;
        result.activated = (new Date()).toString();
        downloadasset.cleanup(targetpath, idPath);
        Promise.all(downloadasset.download_files(baseUrl, req.body.artifact, targetpath, idPath)).then(function (artifacts) {
            artifacts.forEach(function (arti) {
                var pkgfile = path.basename(arti);
                if (pkgfile == "package.json") {
                    console.log(pkgfile);
                    var pkgJson = require(path.join(targetpath, idPath, pkgfile));
                    var dep = pkgJson.dependencies;
                    if (dep) {
                        console.log(dep);
                        var hasError = installDependencies(targetpath, dep);
                    }
                }
            });
            // Construct the Executor
            var entryfile = (baseUrl == "") ? targetpath + '/' + idPath + '/' + path.basename(req.body.entry)
                : path.join(targetpath, idPath, req.body.entry);
            var exec = Object.create(executor);
            if (exec.init(entryfile)) {
                global.cxt.map[idPath] = {
                    src: entryfile,
                    executor: exec,
                    activated: result.activated
                };
                fs.writeJSONSync(path.join(req.app.locals.shelfPath, 'context.json'), global.cxt.map, {spaces: 4});
                res.json(result);
            } else {
                downloadasset.cleanup(targetpath, idPath);
                res.status(404).send({"Error": 'Cannot initiate the executor.'});
            }
        })
            .catch(function (errors) {
                setTimeout(function () {
                    downloadasset.cleanup(targetpath, idPath);
                    res.status(404).send({"Error": 'Cannot download ' + errors});
                }, 500);
            });
    }
});

/* POST dependencies to install*/
router.post('/dependencies', function (req, res, next) {
    var targetpath = req.app.locals.shelfPath;
    fs.ensureDirSync(targetpath);
    if (req.body.dependencies) {
        var hasError = installDependencies(targetpath, req.body.dependencies);
        if (hasError) {
            res.status(400).send({"Error": "Failed installing dependencies"});
        } else {
            res.send({"Info": "Dependencies installed."});
        }
    } else {
        res.status(400).send({"Error": "No dependency specified."});
    }
});

router.get('/mem', function (req, res, next) {
    res.send(process.memoryUsage());
});

router.post('/:ep', function (req, res, next) {
    if (global.cxt.map[req.params.ep]) {
        processEndpointwithGlobalCxtExecutor(req.params.ep, req.body).then(function (output) {
            output.request_id = req.id;
            res.send(output);
        }).catch(function (error) {
            res.status(400).send({"Error": error});
        });
    } else {
        res.status(404).send({"Error": 'Cannot found the endpoint: ' + req.params.ep});
    }
});

function installDependencies(targetpath, dependencies) {
    shelljs.cd(targetpath);
    var hasError = false;
    for (var key in dependencies) {
        if (dependencies[key].startsWith('http') | dependencies[key].startsWith('https')) {
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
    var func = global.cxt.getExecutorByHash(key);
    var output = {};
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

function endpointhash(uri){
    var hash = 0, i, chr;
    for (i = 0; i < uri.length; i++) {
        chr   = uri.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash +"";
}

function invalidInput(obj) {
    var bool = false;
    bool = bool | (obj.artifact == null) | (obj.artifact == "");
    bool = bool | (obj.entry == null);
    bool = bool | (obj.uri == null);
    return bool;
}

module.exports = {router, endpointhash};
