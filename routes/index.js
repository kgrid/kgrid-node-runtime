var express = require('express');
var fs = require('fs-extra')
var router = express.Router();
const path= require('path')
const downloadasset = require('./downloadasset')

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req)
  res.render('index', { title: 'KGrid NodeJS Express Runtime' });
});

/* GET home page. */
router.get('/info', function(req, res, next) {
  var protocol = "https"
  if(process.env.NODE_ENV){
    if(process.env.NODE_ENV.toLowerCase() == "dev") {
      protocol = req.protocol
    }
  }
  var infoObj = {}
  infoObj.Status ="Up"
  infoObj.Url =  protocol +"://"+req.get('host')
  res.send(infoObj);
});

router.get('/endpoints', function(req, res, next) {
  var epArray=[]
  for(var key in req.app.locals.koreg){
    epArray.push(req.protocol+"://"+req.get('host')+key)
  }
  res.send(epArray)
})

/* POST a KO to activate */
router.post('/activate', function(req, res, next) {
  var targetpath = './shelf'
  var idpath ='/'+req.body.arkid.replace("ark:/","").replace("/", "-")+'-'+req.body.version
  if(req.body.artifacts==""){
    res.send('Error. Resource URL is missing.')
  }else {
    // Download resources
    var opid='/'+req.body.arkid.replace("ark:/","")+'/'+req.body.version+'/'+req.body.endpoint
    var default_opid = '/'+req.body.arkid.replace("ark:/","")+'/'+req.body.endpoint
    var result = {}
    result.arkid = req.body.arkid
    result.version = req.body.version
    result.endpoint_url = req.protocol+"://"+req.get('host')+opid
    if(req.body.default===true){
      result.endpoint_url = req.protocol+"://"+req.get('host')+default_opid
    }
    result.activated = (new Date()).toString()
    result.artifact = []
    Promise.all(downloadasset.download_files(req.body.artifacts, targetpath, idpath)).then(function (artifacts) {
      artifacts.forEach(function (e) {
        if(typeof e === 'string'){
          var ext = path.extname(e)
          result.artifact.push(targetpath+idpath+'/'+ path.basename(e))
        }
      })
      req.app.locals.koreg[opid]='.'+targetpath+ idpath+'/'+ req.body.entry
      if(req.body.default===true){
        req.app.locals.koreg[default_opid]='.'+targetpath+ idpath+'/'+ req.body.entry
      }
      fs.writeJSONSync('koregistry.json', req.app.locals.koreg,{spaces: 4} )
      res.json(result);
    })
    .catch(errors => {
      res.send('Cannot download:'+errors)
    });
  }
});

router.post('/:naan/:name/:ep', function(req, res, next) {
  processEndpoint(req, res, next, '/'+req.params.naan+"/"+req.params.name+'/'+req.params.ep)
});

router.post('/:naan/:name/:version/:ep', function(req, res, next) {
  processEndpoint(req, res, next, '/'+req.params.naan+"/"+req.params.name+'/'+req.params.version+'/'+req.params.ep)
});

/* GET home page. */
router.get('/:naan/:name/:version/service', function(req, res, next) {
  servicebyid(req, res, next, req.params.naan+"-"+req.params.name+'-'+req.params.version)
});

function processEndpoint(req, res, next, key){
  var func = require(req.app.locals.koreg[key])
  var output = {}
  output.ko="ark:/"+req.params.naan+"/"+req.params.name
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

function servicebyid (req, res, next, kopath){
  var fileName = ''
  var serviceYaml = path.join(__dirname, '../shelf',kopath,'service.yaml')
  console.log(serviceYaml)
  if(fs.existsSync(serviceYaml)){
    fileName = serviceYaml
    res.sendFile(fileName, function (err) {
      if (err) {
        console.log(err)
        next(err)
      } else {
        console.log('Sent:', fileName)
      }
    })
  }else
  {
    res.send('Not found')
  }
}
module.exports = router;
