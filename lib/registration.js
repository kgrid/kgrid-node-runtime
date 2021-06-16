const pjson = require('./../package.json');
const kgridProxyAdapterUrl = require('../lib/paths').kgridProxyAdapterUrl
const environmentSelfUrl = require('../lib/paths').environmentSelfUrl
const axios = require('axios').default;
const log = require('./logger')

module.exports = function (app, forceUpdate) {
    let reqBody = {};
    reqBody.engine = 'node';
    reqBody.version = pjson.version
    reqBody.url = environmentSelfUrl
    reqBody.contextKeys = Object.keys(global.cxt.map);
    reqBody.forceUpdate = forceUpdate;
    axios.post(kgridProxyAdapterUrl + "/proxy/environments",
        reqBody)
        .then(function (response) {
            log(
                forceUpdate ? 'info' : 'debug',
                `Registered remote environment in activator at ${kgridProxyAdapterUrl} with response: ${JSON.stringify(response.data)}`)
            app.locals.info.activatorUrl = kgridProxyAdapterUrl;
        })
        .catch(function (error) {
            if (error.response) {
                log('warn', error.response.data);
                log('debug', error);
            } else {
                log('warn', error.message);
                log('debug', error);
            }
        });
}
