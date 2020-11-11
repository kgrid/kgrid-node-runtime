# KGrid Node Runtime

KGrid Node Runtime, enabled by express server

## Installation

```
npm install -g @kgrid/noderuntime

```

## Configuration

Set the environmental variable of `KGRID_PROXY_ADAPTER_URL` to the activator URL.
(Default: http://localhost:8080)

Set the environmental variable of `KGRID_NODE_ENV_URL` to the runtime URL.
(Default: http://localhost:3000)

Set the environmental variable of `KGRID_NODE_ENV_PORT` to the port this runtime will run at.
(Default:3000)

If you set `KGRID_NODE_CACHE_OBJECTS` to `true` then objects which have already been activated in the node runtime will never be replaced.

To change the location of the internal storage location for object code set `KGRID_NODE_SHELF_PATH`, otherwise it will be in the `shelf` directory.

## Start the runtime

Start the runtime by
```
kgrid-node
```
