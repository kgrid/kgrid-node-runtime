var express = require('express');
var fs = require('fs-extra')
var router = express.Router();
const path= require('path')
const Hashids = require('hashids/cjs')
const downloadasset = require('./downloadasset')
const shelljs = require('shelljs')

/* GET home page. */
router.get('/', function(req, res, next) {
  // console.log(req)
  res.render('index', { title: 'KGrid NodeJS Express Runtime' });
});

/* GET home page. */
router.get('/info', function(req, res, next) {
  var protocol = getProtocol(req)
  var infoObj = {}
  infoObj.Status ="Up"
  infoObj.Url =  protocol +"://"+req.get('host')
  res.send(infoObj);
});

router.get('/context', function(req, res,next){
    res.send(req.app.locals.context)
})

router.get('/koregistry', function(req, res,next){
    res.send(req.app.locals.koreg)
})

router.get('/endpoints', function(req, res, next) {
  var protocol = getProtocol(req)
  var epArray=[]
  for(var key in req.app.locals.koreg){
    epArray.push(protocol+"://"+req.get('host')+'/'+key)
  }
  res.send(epArray)
})

/* POST a deployment descriptor to activate */
router.post('/deployments', function(req, res, next) {

  var targetpath = req.app.locals.shelfPath
  fs.ensureDirSync(targetpath)
  var idpath = "kn"
  var id = ""
  var version = ""
  var protocol = getProtocol(req)
  if(req.body.artifact==null | req.body.artifact=="" | req.body.entry ==null ){
    res.status(400).send({"Error":"Bad Request"})
  }else {
    // Download resources
    idpath = "kn"+hashid(path.basename(req.body.artifact[0]))
    id = req.body.identifier || idpath
    version = req.body.version || idpath
    var result = {}
    result.endpoint_url = protocol+"://"+req.get('host')+"/"+idpath
    result.activated = (new Date()).toString()
    Promise.all(downloadasset.download_files(req.body.artifact, targetpath, idpath)).then(function (artifacts) {
      req.app.locals.context[id]={}
      req.app.locals.context[id][version]=idpath
      req.app.locals.koreg[idpath]=targetpath+ '/'+idpath+'/'+ path.basename(req.body.entry)
      fs.writeJSONSync(path.join(req.app.locals.shelfPath,'koregistry.json'), req.app.locals.koreg,{spaces: 4} )
      fs.writeJSONSync(path.join(req.app.locals.shelfPath,'context.json'), req.app.locals.context,{spaces: 4} )

      res.json(result);
    })
    .catch(errors => {
      res.status(404).send({"Error":'Cannot download '+errors})
    });
  }
});

/* POST dependencies */
router.post('/dependencies', function(req, res, next) {
  if(req.body.dependencies){
    shelljs.cd(path.join(process.cwd(),'shelf'))
    var hasError = false
    for(var key in req.body.dependencies){
        if(req.body.dependencies[key].startsWith('http')){
          if(shelljs.error(shelljs.exec('npm install --save '+req.body.dependencies[key]))) {
            hasError = true
          }
        } else {
          if(shelljs.error(shelljs.exec('npm install --save '+key))) {
            hasError = true
          }
        }
      }
      if(hasError){
        res.status(400).send({"Error":"Failed installing dependencies"})
      } else {
        res.send({"Info":"Dependencies installed."})
    }
  } else {
    res.status(400).send({"Error":"No dependency specified."})
  }
})

router.post('/:ep', function(req, res, next) {
  if(req.app.locals.koreg[req.params.ep]){
    // processEndpoint(req, res, next, req.params.ep)
    processEndpointwithexecutor(req, res, next, req.params.ep)
  } else {
    res.status(404).send({"Error": 'Cannot found the endpoint: '+req.params.ep})
  }
});


function hashid(filename){
  var ts = new Date()
  const hashids = new Hashids(ts.toString()+filename, 10)
  return hashids.encode(1,2)
}

function getProtocol(req) {
  var protocol = "https"
  if(process.env.NODE_ENV){
    if(process.env.NODE_ENV.toLowerCase() == "dev") {
      protocol = req.protocol
    }
  }
  return protocol
}

function processEndpoint(req, res, next, key){
  var func = require(req.app.locals.koreg[key])
  var output = {}
  // output.ko="ark:/"+req.params.naan+"/"+req.params.name
  if(func.constructor.name === "AsyncFunction"){
    func(req.body).then(function(data){
        output.result = data
        res.send(output);
    })
  } else {
    output.result = func(req.body)
    res.send(output);
  }
}

function processEndpointwithexecutor(req, res, next, key){
  var func = require(req.app.locals.koreg[key])
  var output = {}
  if(func.constructor.name === "AsyncFunction"){
    processAsyncExecutor(func, req.body).then(function(data){
        output.result = data
        res.send(output);
    })
  } else {
    output.result = processSyncExecutor(func, req.body)
    res.send(output);
  }
}

function processAsyncExecutor(func, input){
  return new Promise((resolve,reject)=> {
    func(req.body).then(function(data){
      resolve(data)
    }).catch((error)=>{
      reject(error)
    });
  })
}

function processSyncExecutor(func,input){
  return func(input)
}

module.exports = router;
