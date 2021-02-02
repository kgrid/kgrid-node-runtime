const fs = require('fs-extra');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');
const bodyParser = require('body-parser');
let express = require('express');
let createError = require('http-errors');
const pkg = require('./package.json');

const executor = require('./lib/executor');
let usersRouter = require('./routes/users');
const index = require('./routes/index');
let configJSON = require('./appProperties.json');
const endpointHash = index.endpointHash;
const indexRouter = index.router;

var heartbeats = require('heartbeats');

morgan.token('id', function getId(req) {
    return req.id;
})

let app = express();
const kgridProxyAdapterUrl = process.env.KGRID_PROXY_ADAPTER_URL || configJSON.kgrid_proxy_adapter_url;
const environmentSelfUrl = process.env.KGRID_NODE_ENV_URL || configJSON.kgrid_node_env_url;
let shelfPath =
    process.env.KGRID_NODE_SHELF_PATH
        ? path.join(process.cwd(), process.env.KGRID_NODE_SHELF_PATH)
        : path.join(process.cwd(), 'shelf');
let contextFilePath = path.join(shelfPath, "context.json");
let packageFilePath = path.join(shelfPath, "package.json");

console.log(`KGrid Node Runtime ${pkg.version}\n\n`);
console.log(`Setting Urls from Environment Variables:
\nKGRID_PROXY_ADAPTER_URL: ${kgridProxyAdapterUrl}
\nKGRID_NODE_ENV_URL: ${environmentSelfUrl}
`);

checkPaths();
setUpExpressApp();
setUpGlobalContext();
createErrorHandlers();

const heartbeatInterval = process.env.KGRID_PROXY_HEARTBEAT_INTERVAL || 30;
let registrationHeartbeat = heartbeats.createHeart(1000);
index.registerWithActivator(app, true);
registrationHeartbeat.createEvent(heartbeatInterval, function(count, last){
  console.log(Date.now()+"  Heartbeat No. "+count);
  index.registerWithActivator(app, false);
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
    app.locals.info.app = pkg.name;
    app.locals.info.version = pkg.version;
    app.locals.info.engine = "node";
    app.locals.info.status = "up";
    app.locals.info.url = environmentSelfUrl;
    app.locals.info.activatorUrl = "";
    app.locals.needsRefresh = true;
    fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    app.use(cors());
    app.use(assignId);
    if (process.env.DEBUG) {
        app.use(morgan('dev'));
    }
    app.use(express.json());
    app.use(bodyParser.text());
    app.use(express.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/', indexRouter);
    app.use('/users', usersRouter);
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
           if (this.map[endpointHash(uri)]) {
                return this.map[endpointHash(uri)].executor;
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
