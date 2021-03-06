const fs = require('fs-extra');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');
const bodyParser = require('body-parser');
const express = require('express');
const createError = require('http-errors');
const pkg = require('./package.json');
const log = require('./lib/logger')
const {logExecutorError} = require('./lib/activation')
const executor = require('./lib/executor');
const registerWithActivator = require('./lib/registration');
const indexRouter = require('./routes/index').router;
const heartbeats = require('heartbeats');

const kgridProxyAdapterUrl = require('./lib/paths').kgridProxyAdapterUrl;
const environmentSelfUrl = require('./lib/paths').environmentSelfUrl;
const shelfPath = require('./lib/paths').shelfPath;
const contextFilePath = require('./lib/paths').contextFilePath;
const localCachePath = require('./lib/paths').localCachePath
const shouldLoadFromCache = require('./lib/paths').shouldLoadFromCache

let app = express();
log('info', `KGrid Node Runtime ${pkg.version}`);
log('info', `Kgrid Proxy Adapter URL: ${kgridProxyAdapterUrl}`)
log('info', `Kgrid Node environment URL: ${environmentSelfUrl}`)
log('info', `Kgrid Node Shelf path: ${shelfPath}`)
log('info', `Kgrid Node endpoint caching enabled: ${shouldLoadFromCache()}`)

checkPaths();
setUpExpressApp();
setUpGlobalContext();
createErrorHandlers();

const heartbeatInterval = process.env.KGRID_PROXY_HEARTBEAT_INTERVAL || 30;
let registrationHeartbeat = heartbeats.createHeart(1000);
registerWithActivator(app, true);
registrationHeartbeat.createEvent(heartbeatInterval, function () {
    registerWithActivator(app, false);
})

function checkPaths() {
    fs.ensureDirSync(shelfPath)
    if (!fs.pathExistsSync(contextFilePath)) {
        fs.ensureFileSync(contextFilePath)
        fs.writeJSONSync(contextFilePath, {}, {spaces: 4})
    }
}

function setUpExpressApp() {
    app.locals.shelfPath = shelfPath;
    app.locals.info = {};
    app.locals.info.url = environmentSelfUrl;
    app.locals.info.activatorUrl = kgridProxyAdapterUrl;
    app.locals.info.app = pkg.name;
    app.locals.info.version = pkg.version;
    app.locals.info.engine = "node";
    app.locals.info.status = "up";
    app.locals.info.shelfPath = shelfPath;
    app.locals.info.cachingEnabled = shouldLoadFromCache();
    app.locals.needsRefresh = true;
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    app.use(cors());
    app.use(assignId);
    app.use(express.json({'strict': false}));
    app.use(bodyParser.text());
    app.use(express.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/', indexRouter);
}

function setUpGlobalContext() {
    global.cxt = {
        map: {},
        getExecutorByHash(key) {
            if (this.map[key]) {
                return this.map[key].executor;
            } else {
                return null;
            }
        },

        getExecutorByID(uri) {
            if (this.map[uri]) {
                return this.map[uri].executor;
            } else {
                return null;
            }
        },
    }
    global.cxt.map = require(contextFilePath)
    if (shouldLoadFromCache()) {
        loadFilesFromContext();
    } else {
        log('info', 'Invalidating Cache');
        fs.removeSync(localCachePath);
        fs.ensureFileSync(contextFilePath);
        fs.writeJSONSync(contextFilePath, {}, {spaces: 4});
    }
}

function loadFilesFromContext() {
    if (Object.keys(global.cxt.map).length > 0) {
        for (let key in global.cxt.map) {
            if (global.cxt.map[key].status === 'Activated') {
                let entryFile = global.cxt.map[key].entry;
                if (fs.existsSync(entryFile)) {
                    log('info', 'Found artifact: ' + entryFile)
                    log('info', 'Using the cached endpoint ' + key);
                    const exec = Object.create(executor);
                    try {
                        exec.init(entryFile);
                        global.cxt.map[key].executor = exec;
                    } catch (error) {
                        logExecutorError(error);
                        deleteCacheEntry(key);
                    }
                } else {
                    deleteCacheEntry(key);
                }
            }
        }
        fs.writeJSONSync(contextFilePath, global.cxt.map, {spaces: 4});
    }
}

function createErrorHandlers() {
    app.use(function (req, res, next) {
        next(createError(404));
    });
    app.use(function (err, req, res) {
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        res.status(err.status || 500);
        res.render('error');
    });
}

function assignId(req, res, next) {
    req.id = uuidv4();
    next();
}

function deleteCacheEntry(key) {
    log('info', 'Deleting invalid entry cache: ' + key)
    delete global.cxt.map[key]
}

module.exports = app;
