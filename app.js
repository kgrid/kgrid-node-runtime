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
const executor = require('./lib/executor');
const registerWithActivator = require('./lib/registration');
const indexRouter = require('./routes/index').router;
const heartbeats = require('heartbeats');

const kgridProxyAdapterUrl = require('./lib/paths').kgridProxyAdapterUrl;
const environmentSelfUrl = require('./lib/paths').environmentSelfUrl;
const shelfPath = require('./lib/paths').shelfPath;
const contextFilePath = require('./lib/paths').contextFilePath;
const packageFilePath = require('./lib/paths').packageFilePath;

let app = express();

log('info', `KGrid Node Runtime ${pkg.version}`);
log('info', `Setting KGRID_PROXY_ADAPTER_URL to: ${kgridProxyAdapterUrl}`)
log('info', `Setting KGRID_NODE_ENV_URL to: ${environmentSelfUrl}`)

checkPaths();
setUpExpressApp();
setUpGlobalContext();
createErrorHandlers();

const heartbeatInterval = process.env.KGRID_PROXY_HEARTBEAT_INTERVAL || 30;
let registrationHeartbeat = heartbeats.createHeart(1000);
registerWithActivator(app, true);
registrationHeartbeat.createEvent(heartbeatInterval, function (count, last) {
    registerWithActivator(app, false);
})

function checkPaths() {
    fs.ensureDirSync(shelfPath)
    if (!fs.pathExistsSync(contextFilePath)) {
        fs.ensureFileSync(contextFilePath)
        fs.writeJSONSync(contextFilePath, {}, {spaces: 4})
    }
    if (!fs.pathExistsSync(packageFilePath)) {
        fs.ensureFileSync(packageFilePath)
        fs.writeJSONSync(packageFilePath, {"name": "expressActivatorShelf"}, {spaces: 4})
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
    app.locals.needsRefresh = true;
    fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});
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
    if (Object.keys(global.cxt.map).length > 0) {
        for (let key in global.cxt.map) {
            if (global.cxt.map[key].status === 'Activated') {
                const exec = Object.create(executor);
                exec.init(global.cxt.map[key].entry);
                global.cxt.map[key].executor = exec;
            }
        }
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

module.exports = app;
