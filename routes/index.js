var express = require('express');
var router = express.Router();

const path= require('path')
const downloadasset = require('./downloadasset')
const unzip = require('./unzipko')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'KGrid NodeJS Runtime Adapter' });
});

/* POST a KO to activate */
router.post('/activate', function(req, res, next) {
  var targetpath = './shelf'
  var idpath ='/'+req.body.arkid.replace("ark:/","").replace("/", "-")+'-'+req.body.version
  if(req.body.url==""){
    res.send('Error. Resource URL is missing.')
  }else {
    // Download resources
    var result = {}
    result.arkid = req.body.arkid
    result.version = req.body.version
    result.endpoint_url = req.protocol+"://"+req.get('host')+'/'+req.body.arkid.replace("ark:/","")+'/'+req.body.endpoint
    result.artifact = []
    result.activated = (new Date()).toString()
    Promise.all(downloadasset.download_files(req.body.url, targetpath, idpath)).then(function (artifacts) {
      artifacts.forEach(function (e) {
        var ext = path.extname(e)
        result.artifact.push(targetpath+'/'+ path.basename(e, ext)+'/'+ req.body.artifact)
      })
      res.json(result);
    })
    .catch(error => {
      console.log(error.message);
    });
  }
});

router.post('/:naan/:name/:ep', function(req, res, next) {
  res.send('ark:/'+req.params.naan+"/"+req.params.name+'/'+req.params.ep)
});

module.exports = router;
