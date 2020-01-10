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
  if(req.body.url==""){
    res.send('Error. Resource URL is missing.')
  }else {
    // Download resources
    downloadasset.download_file(req.body.url)
    .then(response => {
      // Manage resources
      unzip(response, targetpath)
      // Send response
      var result = {}
      result.arkid = req.body.arkid
      result.endpoint_url = req.protocol+"://"+req.get('host')+'/'+req.body.arkid.replace("ark:/","")+'/'+req.body.endpoint
      result.artifact =targetpath+'/'+ path.basename(response, '.zip')+'/'+ req.body.artifact
      result.activated = (new Date()).toString()
      res.json(result);
    })
    .catch(error => {
      res.send(error)
    })
  }
});

router.post('/:naan/:name/:ep', function(req, res, next) {
  res.send('ark:/'+req.params.naan+"/"+req.params.name+'/'+req.params.ep)
});

module.exports = router;
