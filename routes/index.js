var express = require('express');
var fs = require('fs-extra')
var router = express.Router();
const path= require('path')
const downloadasset = require('./downloadasset')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'KGrid NodeJS Runtime Adapter' });
});

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
      // console.log(errors);
      res.send('Cannot download:'+errors)
    });
  }
});

router.post('/:naan/:name/:ep', function(req, res, next) {
  var key = '/'+req.params.naan+"/"+req.params.name+'/'+req.params.ep
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
});

router.post('/:naan/:name/:version/:ep', function(req, res, next) {
  var key = '/'+req.params.naan+"/"+req.params.name+'/'+req.params.version+'/'+req.params.ep
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
});

module.exports = router;
