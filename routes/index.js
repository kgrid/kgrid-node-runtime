var express = require('express');
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
  if(req.body.url==""){
    res.send('Error. Resource URL is missing.')
  }else {
    // Download resources
    var result = {}
    result.arkid = req.body.arkid
    result.version = req.body.version
    result.endpoint_url = req.protocol+"://"+req.get('host')+'/'+req.body.arkid.replace("ark:/","")+'/'+req.body.endpoint
    result.activated = (new Date()).toString()
    result.artifact = []
    Promise.all(downloadasset.download_files(req.body.url, targetpath, idpath)).then(function (artifacts) {
      artifacts.forEach(function (e) {
        console.log(e)
        if(typeof e === 'string'){
          var ext = path.extname(e)
          result.artifact.push(targetpath+idpath+'/'+ path.basename(e))
        }
      })
      res.json(result);
    })
    .catch(errors => {
      // console.log(errors);
      res.send('Cannot download:'+errors)
    });
  }
});

router.post('/:naan/:name/:ep', function(req, res, next) {
  res.send('ark:/'+req.params.naan+"/"+req.params.name+'/'+req.params.ep)
});

module.exports = router;
