var express = require('express');
const Hashids = require('hashids/cjs')
const downloadasset = require('../lib/downloadasset')
var fs = require('fs-extra')
const path= require('path')
const shelljs = require('shelljs')
const executor = require('../lib/executor')
var router = express.Router();


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

// router.get('/echo', function(req, res, next){
//     console.log(req)
//     res.send(req.body)
// })

router.get('/context', function(req, res,next){
    res.send(global.cxt)
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
  var endpoint = ""
  var protocol = getProtocol(req)
  if(req.body.artifact==null | req.body.artifact=="" | req.body.entry ==null ){
    res.status(400).send({"Error":"Bad Request"})
  }else {
    // Download resources
    idpath = "kn"+hashid(path.basename(req.body.artifact[0]))
    id = req.body.identifier || idpath
    version = req.body.version || idpath
    endpoint = req.body.endpoint || idpath
    var result = {}
    result.endpoint_url = protocol+"://"+req.get('host')+"/"+idpath
    result.activated = (new Date()).toString()
    Promise.all(downloadasset.download_files(req.body.artifact, targetpath, idpath)).then(function (artifacts) {
      global.cxt.map[idpath] = {}
      global.cxt.map[idpath].arkid = id
      global.cxt.map[idpath].version = version
      global.cxt.map[idpath].endpoint = endpoint
      global.cxt.map[idpath].src = targetpath+ '/'+idpath+'/'+ path.basename(req.body.entry)
      const exec = Object.create(executor)
      exec.init(global.cxt.map[idpath].src)
      global.cxt.map[idpath].executor = exec
      req.app.locals.koreg[idpath]=targetpath+ '/'+idpath+'/'+ path.basename(req.body.entry)
      fs.writeJSONSync(path.join(req.app.locals.shelfPath,'koregistry.json'), req.app.locals.koreg,{spaces: 4} )
      fs.writeJSONSync(path.join(req.app.locals.shelfPath,'context.json'), global.cxt.map,{spaces: 4} )
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
router.get('/mem', function(req, res, next){
  const used = process.memoryUsage();
  for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  res.send(used)
})

router.post('/tst', function(req, res, next){
  processEndpointwithGlobalCxtExecutor("knxW84nTAdyz", req.body).then(function(output){
    output.request_id=req.id
    res.send(output)
  }).catch(function(error){
    res.send({"Error":error})
  })
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
        output.request_id= req.id
        output.result = data
        res.send(output);
    })
  } else {
    output.result = func(req.body)
    res.send(output);
  }
}

function processEndpointwithexecutor(req, res, next, key){
  var func =global.cxt.map[key].executor
  var output = {}
  func.execute(req.body).then(function(data){
        output.request_id= req.id
        output.result = data
        res.send(output);
    })
}

function processEndpointwithGlobalCxtExecutor(key, input){
  var func = global.cxt.getExecutor(key)
  var output = {}
  return new Promise((resolve, reject)=>{
    func.execute(input).then(function(data){
        output.result = data
        resolve(output);
      }).catch(error=>{
        reject(error)
      })
    })
}

function appContext(key) {
  return global.cxt[key]
}

module.exports = router;
