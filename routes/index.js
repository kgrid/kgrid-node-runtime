let express = require('express');
const fs = require('fs-extra');
let router = express.Router();
const log = require('../lib/logger')
const kgridProxyAdapterUrl = require('../lib/paths').kgridProxyAdapterUrl
const shelfPath = require('../lib/paths').shelfPath
const findEndpoint = require('../lib/findEndpoint')
const registerWithActivator = require('../lib/registration')
const activateEndpoint = require('../lib/activation')
const installDependencies = require('../lib/dependencies')
const {shouldLoadFromCache} = require('../lib/downloadasset');
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
        const epObj = findEndpoint(key, req);
        epArray.push(epObj);
    }
    res.send(epArray);
});

router.get('/endpoints/:naan/:name/:version/:endpoint', function (req, res) {
    let uri = constructUri(req);
    const epObj = findEndpoint(uri, req);
    res.send(epObj);
});

/* POST a deployment descriptor to activate */
router.post('/endpoints', function (req, res) {
    if (invalidInput(req.body)) {
        log('warn', `Could not deploy endpoint: ${req.body.uri}. Error: 400 - Bad Request`)
        res.status(400).send({"description": "Bad Request"});
    } else {
        let id = req.body.uri;
        let baseUrl = req.body.baseUrl || "";
        let result = {};
        result.id = id;
        result.uri = id;
        result.activated = (new Date()).toString();
        result.status = "Activated"

        if (global.cxt.map[id] && global.cxt.map[id].isProcessing) {
            result.status = 'Endpoint is in processing, try again later.';
            res.status(503).json(result);
        } else if (global.cxt.map[id] && shouldLoadFromCache()) {
           log('info','Using the cached endpoint '+id);
            res.json(result);
        } else {
            activateEndpoint(baseUrl, id, req, res, result);
        }
    }
});

/* POST dependencies to install*/
router.post('/dependencies', function (req, res) {
    fs.ensureDirSync(shelfPath);
    if (req.body.dependencies) {
        let hasError = installDependencies(req.body.dependencies);
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

router.post('/:naan/:name/:version/:endpoint', function (req, res) {
    let endpointUri = constructUri(req);
    if (global.cxt.map[endpointUri]) {
        processEndpointWithGlobalCxtExecutor(endpointUri, req.body).then(function (output) {
            output.request_id = req.id;
            res.send(output);
        }).catch(function (error) {
            res.status(400).send({"description": error.message});
        });
    } else {
        res.status(404).send({"description": 'Cannot found the endpoint: ' + endpointUri});
    }
});


function processEndpointWithGlobalCxtExecutor(key, input) {
    let func = global.cxt.getExecutorByHash(key);
    let output = {};
    return new Promise((resolve, reject) => {
        func.execute(input).then(function (data) {
            output.result = data;
            resolve(output);
        }).catch(error => {
            log('warn', error.message);
            log('debug', error);
            reject(error);
        });
    });
}

function invalidInput(obj) {
    return !(obj.artifact && obj.entry && obj.uri && obj.artifact !== "")
}

function constructUri(req) {
    return req.params.naan + "/" + req.params.name + "/" + req.params.version + "/" + req.params.endpoint;
}

module.exports = {router};
