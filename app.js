const fs = require('fs-extra');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const commandLineArgs = require('command-line-args');
var express = require('express');
var createError = require('http-errors');
const axios = require('axios').default;
const pkg = require('./package.json');

const executor = require('./lib/executor')
var usersRouter = require('./routes/users');
var indexRouter = require('./routes/index');
var configJSON = require('./appproperties.json');

morgan.token('id', function getId(req) {
  return req.id;
})

const kgridAdpaterProxyUrl = process.env.KGRID_ADAPTER_PROXY_URL || configJSON.kgrid_adapter_proxy_url;
const environmentSelfUrl = process.env.ENVIRONMENT_SELF_URL || configJSON.environment_self_url;
console.log(`KGrid Node Runtime ${pkg.version}\n\n`)
console.log(`Setting Urls from Environment Variables:
\nKGRID_ADAPTER_PROXY_URL: ${kgridAdpaterProxyUrl}
\nENVIRONMENT_SELF_URL: ${environmentSelfUrl}
`);
var app = express();

const optionDefinitions = [
  { name: 'shelf', alias: 's', type: String, defaultOption: false }
]
const options = commandLineArgs(optionDefinitions, { partial: true })

var shelfPath = options.shelf || path.join(process.cwd(), 'shelf')
fs.ensureDirSync(shelfPath)

var contextFile = path.join(shelfPath, "context.json")
if (!fs.pathExistsSync(contextFile)) {
  fs.ensureFileSync(contextFile)
  fs.writeJSONSync(contextFile, {}, { spaces: 4 })
}
var packageFile = path.join(shelfPath, "package.json")
if (!fs.pathExistsSync(packageFile)) {
  fs.ensureFileSync(packageFile)
  fs.writeJSONSync(packageFile, { "name": "expressactivatorshelf" }, { spaces: 4 })
}

app.locals.shelfPath = shelfPath

app.locals.info = {};
app.locals.info.app=pkg.name
app.locals.info.version = pkg.version
app.locals.info.Status ="Up";
app.locals.info.appUrl = environmentSelfUrl;
app.locals.info.Registered_With_Activator = "";

global.cxt = {
  map: {},
  getExecutor(key) {
    if (this.map[key]) {
      return this.map[key].executor
    } else {
      return null
    }
  },
  getExecutorByID(identifier, version, endpoint) {
    for (var key in this.map) {
      var e = this.map[key]
      if ((e.identifier == identifier) && (e.version == version) && (e.endpoint == endpoint)) {
        return e.executor
      }
    }
    return null
  },
  getKeyByID(identifier, version, endpoint) {
    for (var key in this.map) {
      var e = this.map[key]
      if ((e.identifier == identifier) && (e.version == version) && (e.endpoint == endpoint)) {
        return key
      }
    }
    return null
  }
}
global.cxt.map = require(contextFile)
if (Object.keys(global.cxt.map).length > 0) {
  for (var key in global.cxt.map) {
    const exec = Object.create(executor);
    exec.init(global.cxt.map[key].src);
    global.cxt.map[key].executor = exec
  }
}
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors())
app.use(assignId)

if (process.env.DEBUG) {
  app.use(morgan('dev'))
}
// app.use(morgan(':id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms', { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

axios.post(kgridAdpaterProxyUrl + "/proxy/environments",
  { "type": "node", "url": environmentSelfUrl })
  .then(function (response) {
    console.log("Registered remote environment in activator at " + kgridAdpaterProxyUrl + " with resp "
      + JSON.stringify(response.data));
    app.locals.info.Registered_With_Activator = kgridAdpaterProxyUrl;
    axios.get(kgridAdpaterProxyUrl + "/activate")
      .catch(function (error) {
        console.log(error.message)
      });
  })
  .catch(function (error) {
    console.log(error.message);
  });


function assignId(req, res, next) {
  req.id = uuidv4()
  next()
}

module.exports = app;
