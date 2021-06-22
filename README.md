# KGrid Node Runtime

KGrid Node Runtime, enabled by express server is a runtime that connects to the proxy adapter in an activator and can be used to run nodejs objects.

## Installation
Make sure you have [node.js](https://nodejs.org) 11.0 or later installed. To download and install the node runtime run
```
npm install -g @kgrid/noderuntime
```

## Installation from an image:

- Download the latest image from docker hub: `docker pull kgrid/noderuntime:#.#.#` where `#.#.#` is the latest version

- Use the following command to run the image on Linux:
```
 sudo docker run --network host kgrid/noderuntime
```
Or
- Use the following command to run the image on Windows:
```
 docker run -it -p :3000:3000 -e KGRID_PROXY_ADAPTER_URL=http://host.docker.internal:8080 kgrid/noderuntime
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

### `ACTIVATE_ON_STARTUP`
- if `TRUE`
  - Activate everything in `context.json`
- if `FALSE`
  - activate only on receipt of activation messages

     
### `USE_CACHED_ENDPOINTS`
- if `TRUE`
    - On activation message (or at startup)
      - if in memory done
      - else activate from local, remote, proxy, and update in `context.json` 
- `FALSE`
    - At startup delete "local" artifacts and `context.json`
    - On activation message or startup 
      - if in memory discard and (re)activate
      - if not, activate 
      - always update local cache and `context.json`


### `KGRID_NODE_CACHE_STRATEGY` (What is the startup behavior?)
- Sets if the objects are cached or overwritten on each activation call. Can take three values: `never`, `always`, or `use_checksum`

    - `never` means that existing objects will be overwritten whenever objects are re-downloaded from the activator.
    - `always` means that existing objects stored in the node runtime will never be re-downloaded from the activator and the local shelf and context.json files must be deleted and the runtime restarted for the objects to be replaced.
    - `use_checksum` means that objects will look for a checksum in the deployment descriptor sent over during activation and only re-download the object if that checksum has changed.
- Default value: `never`

### `KGRID_NODE_SHELF_PATH`
- Sets the location of the objects' code storage directory. 
- Default: `shelf`
- Note: If this variable is set to the activator's shelf, the runtime will use the existing artifacts for the activation, without the need to fetch them through the `/proxy/artifacts` endpoints.
  
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

In this example: `POST <activator url>/hello/neighbor/1.0/welcome`
## Examples
An example KO can be found in our [example collection](https://github.com/kgrid-objects/example-collection/releases/latest) here:
[node/simple/1.0](https://github.com/kgrid-objects/example-collection/releases/latest/download/node-simple-v1.0.zip)


## Build and Deploy a cloud native image

### Build the image of kgrid-node-Runtime

Use the following command to build the image:
```
 sudo docker build -t kgrid/noderuntime .
```

### Push to DockerHub
Use the following command to push the image:
```
 sudo docker push kgrid/noderuntime:#.#.#
```

### Run the image locally
 Use the following command to run the image on Linux:
```
 sudo docker run --network host kgrid/noderuntime
```

 Use the following command to run the image on Windows:
```
 docker run -it -p :3000:3000 -e KGRID_PROXY_ADAPTER_URL=http://host.docker.internal:8080 kgrid/noderuntime
```

### Pushing an image directly to Heroku
1. Log in to Heroku by	`heroku login`

1. Log in to Heroku Container Registry by `heroku container:login`

1. Tag the image with (change #.#.# to version)
   ```bash
   docker tag <image> registry.heroku.com/<app>/web
   ```
   `<image>` will be `kgrid/noderuntime:###`

1. Push to Heroku:
   ```bash
   docker push registry.heroku.com/<app>/web
   ```
1. Release the image so Heroku can start the deployment process
   ```bash
   heroku container:release web -a <app>
   ```


## Important Notes
- Editing the cache directly from the runtime's shelf will
not propagate changes to the endpoints in the runtime. New
KOs must come from the activator.
- The runtime will attempt to load any Knowledge Objects that
were previously loaded onto its shelf before registering with
the activator and acquiring its objects. The shelf directory can
be deleted if there is a need to get all objects fresh from the activator.
