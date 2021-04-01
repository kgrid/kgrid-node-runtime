# KGrid Node Runtime

KGrid Node Runtime, enabled by express server is a runtime that connects to the proxy adapter in an activator and can be used to run nodejs objects.

## Installation
Make sure you have [node.js](https://nodejs.org) 11.0 or later installed. To download and install the node runtime run
```
npm install -g @kgrid/noderuntime
```

## Configuration

###`KGRID_PROXY_ADAPTER_URL`
- URL of the activator that will communicate with this runtime
- Default value: `http://localhost:8080`

###`KGRID_NODE_ENV_URL`
- The url of this runtime that is accessible to the activator.
- Default value: `http://localhost:3000`

###`KGRID_NODE_ENV_PORT`
- The port this runtime will be accessible on.
- Default value: `3000`

###`KGRID_PROXY_HEARTBEAT_INTERVAL`
- The interval (in seconds) of the heartbeat when this runtime will ping and try to reconnect to the activator. The value of 0 or negative number will disable the heartbeat.
- Default value:`30`

###`KGRID_NODE_CACHE_STRATEGY`
- Sets if the objects are cached or overwritten on each activation call. Can take three values: `never`, `always`, or `use_checksum`

    - `never` means that existing objects will be overwritten whenever objects are re-downloaded from the activator.
    - `always` means that existing objects stored in the node runtime will never be re-downloaded from the activator and the local shelf and context.json files must be deleted and the runtime restarted for the objects to be replaced.
    - `use_checksum` means that objects will look for a checksum in the deployment descriptor sent over during activation and only re-download the object if that checksum has changed.
- Default value: `never`

###`KGRID_NODE_SHELF_PATH`
- Sets the location of the objects' code storage directory.
- Default: `shelf`

###`DEBUG`
- Changes the logging level to debug, takes a boolean `true`/`false`
- Default: `false`

## Start the runtime

Start the runtime by running
```
kgrid-node
```

## Writing a Knowledge Object in Node

An example KO with naan of `hello`, a name of `neighbor`, api version of `1.0`, and endpoint `welcome`,
a Deployment Specification might look like this:

```yaml
/welcome:
  post:
    artifact:
      - src/welcome.js
      - src/helper-code.js
      - package.json
    engine: node
    function: main
    entry: src/welcome.js
```
Where `engine` is `node`, `function` is the name of the main entry function in the code and `entry` is the name of the file containing that function.

To use npm dependencies include a simple `package.json` file with a `dependencies` node. See the [node/dependencies/v1.0](https://github.com/kgrid-objects/example-collection/tree/master/collection/node-dependencies-v1.0) object for an example.

You would then execute this endpoint to see the code work:

`POST <activator url>/<naan>/<name>/<api version>/<endpoint>`

In this example: `POST <activator url>/hello/neighbor/1.0/welcome`
##Examples
An example KO can be found in our [example collection](https://github.com/kgrid-objects/example-collection/releases/latest) here:
[node/simple/1.0](https://github.com/kgrid-objects/example-collection/releases/latest/download/node-simple-v1.0.zip)


## Important Notes
- Editing the cache directly from the runtime's shelf will
not propagate changes to the endpoints in the runtime. New
KOs must come from the activator.
- The runtime will attempt to load any Knowledge Objects that
were previously loaded onto its shelf before registering with
the activator and acquiring its objects. The shelf directory can
be deleted if there is a need to get all objects fresh from the activator.
