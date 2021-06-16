module.exports = function (key, req) {
    let endpoint = global.cxt.map[key];
    let baseUrl = req.app.locals.info.url;
    let url;
    if (baseUrl.endsWith('/')) {
        url = baseUrl + key;
    } else {
        url = baseUrl + '/' + key;
    }
    epObj = {
        "id": endpoint.id,
        "activated": endpoint.activated,
        "status": endpoint.status
    }
    if (endpoint.status === "Activated") {
        epObj.url = url;
    }
    return epObj;
}