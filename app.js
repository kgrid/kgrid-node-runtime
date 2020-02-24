const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs-extra')
const cors = require('cors')
const commandLineArgs = require('command-line-args')
var express = require('express');
var createError = require('http-errors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var app = express();

const optionDefinitions = [
  { name: 'shelf', alias: 's', type: String, defaultOption: true }
]
const options = commandLineArgs(optionDefinitions)

var shelfPath = options.shelf || path.join(process.cwd(),'shelf')
fs.ensureDirSync(shelfPath)
var registryFile = path.join(shelfPath,"koregistry.json")
if(!fs.pathExistsSync(registryFile)){
  fs.ensureFileSync(registryFile)
  fs.writeJSONSync(registryFile, {},{spaces: 4} )
}
var packageFile = path.join(shelfPath,"package.json")
if(!fs.pathExistsSync(packageFile)){
  fs.ensureFileSync(packageFile)
  fs.writeJSONSync(packageFile, {},{spaces: 4} )
}


var koreg = require(registryFile)
app.locals.koreg = koreg
app.locals.shelfPath = shelfPath

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors())
if(process.env.DEBUG){
  app.use(logger('dev'))
}
app.use(logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms ":user-agent"', { stream: accessLogStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
