const path = require('path');
const configJSON = require('../appProperties.json')

let kgridProxyAdapterUrl = process.env.KGRID_PROXY_ADAPTER_URL || configJSON.kgrid_proxy_adapter_url;
if (kgridProxyAdapterUrl.endsWith("/")) {
    kgridProxyAdapterUrl = kgridProxyAdapterUrl.substr(0, kgridProxyAdapterUrl.length - 1);
}

const environmentSelfUrl = process.env.KGRID_NODE_ENV_URL || configJSON.kgrid_node_env_url;
let shelfPath = process.env.KGRID_NODE_SHELF_PATH
    ? path.join(process.cwd(), process.env.KGRID_NODE_SHELF_PATH)
    : path.join(process.cwd(), 'shelf');
let contextFilePath = path.join(shelfPath, "context.json");

module.exports = {kgridProxyAdapterUrl, environmentSelfUrl, shelfPath, contextFilePath};
