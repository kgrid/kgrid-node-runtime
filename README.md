# KGrid Node Runtime

KGrid Node Runtime, enabled by express server is a runtime that connects to the proxy adapter in an activator and can be used to run nodejs objects.

## Installation
Make sure you have [node.js](https://nodejs.org) 11.0 or later installed. To download and install the node runtime run
```
npm install -g @kgrid/noderuntime
```
- Note: This runtime stores all endpoints received from activation in `current directory/kgrid_node/node` and any node modules required by deployed endpoints will be stored in `current directory/kgrid_node/node_modules`. Because of this, it will require write access to its current directory.

## Installation from an image:

- Download the latest image from docker hub: `docker pull kgrid/kgrid-node-runtime:latest`

- Use the following command to run the image on Linux:
```
 docker run --network host kgrid/kgrid-node-runtime
```
Or
- Use the following command to run the image on Windows:
```
 docker run -it -p 3000:3000 -e KGRID_PROXY_ADAPTER_URL=http://host.docker.internal:8080 kgrid/kgrid-node-runtime
```

This starts the runtime pointed to an activator running on the same system at localhost:8080


## Endpoints

The runtime exposes two endpoints which can be used to see the details of the runtime and what has been activated

### `GET /info`
Displays details about the runtime such as the running version and status.

### `GET /endpoints`
Displays a list of the activated endpoints in the engine.

## Configuration

### `KGRID_PROXY_ADAPTER_URL`
- URL of the activator that will communicate with this runtime
- Default value: `http://localhost:8080`

### `KGRID_NODE_ENV_URL`
- The url of this runtime that is accessible to the activator.
- Default value: `http://localhost:3000`

### `KGRID_NODE_ENV_PORT`
- The port this runtime will be accessible on.
- Default value: `3000`

### `KGRID_PROXY_HEARTBEAT_INTERVAL`
- The interval (in seconds) of the heartbeat when this runtime will ping and try to reconnect to the activator. The value of 0 or negative number will disable the heartbeat.
- Default value:`30`

### `KGRID_NODE_LOAD_FROM_CACHE`
- Sets if the objects are cached or overwritten on each activation call
    - `true` means the node runtime will attempt to load endpoints from its internal cache on startup, and when receiving activation messages
    - `false` means the node runtime will always load endpoints new, and anything in its cache will be overwritten on startup, or when receiving activation messages.
- Default value: `false`

### `KGRID_NODE_SHELF_PATH`
- Sets the location of the objects' code storage directory. 
- Default: `shelf`
- Note: If this variable is set to the activator's shelf, the runtime will use the existing artifacts for the activation, without the need to fetch them through the `/proxy/artifacts` endpoints.
- Note: If this directory is read only, you must set `KGRID_NODE_LOAD_FROM_CACHE` to `true`

### `NODE_PATH`
- Sets the system location for installing node modules specified in package.json files inside KO's.
- Default: none
- If using a released version of the node runtime, you must set `NODE_PATH` to `kgrid_node/node_modules` in the current directory. Otherwise, your KO's will not be able to require node packages.
    - Unix: `export NODE_PATH=$(pwd)/kgrid_node/node_modules`
    - Windows: `set NODE_PATH=%cd%\kgrid_node\node_modules`

### `DEBUG`
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

In this example: `POST <activator url>/node/dependencies/1.0/welcome`
## Examples
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
