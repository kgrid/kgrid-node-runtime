const path = require('path');
const configJSON = require('../appProperties.json')

let kgridProxyAdapterUrl = process.env.KGRID_PROXY_ADAPTER_URL || configJSON.kgrid_proxy_adapter_url;
if (kgridProxyAdapterUrl.endsWith("/")) {
    kgridProxyAdapterUrl = kgridProxyAdapterUrl.substr(0, kgridProxyAdapterUrl.length - 1);
}
const environmentSelfUrl = process.env.KGRID_NODE_ENV_URL || configJSON.kgrid_node_env_url;
let localCachePath = path.join(process.cwd(), 'kgrid_node');
let shelfPath = process.env.KGRID_NODE_SHELF_PATH
    ? path.join(process.cwd(), process.env.KGRID_NODE_SHELF_PATH)
    : localCachePath;
let contextFilePath = path.join(localCachePath, "context.json");

module.exports = {kgridProxyAdapterUrl, environmentSelfUrl, shelfPath, contextFilePath, localCachePath};
