# KGrid Node Runtime

KGrid Node Runtime, enabled by express server


## Installation

```
npm install -g @kgrid/noderuntime

```


## Usage - For local development

Make sure a KGrid activator is running on http://localhost:8080.

Set the environmental variable of `NODE_ENV` to `DEV`

Start the runtime by
```
kgrid-node
```

## Usage - For testing with the activator externally hosted

Set the environmental variable of `KGRID_ADAPTER_PROXY_URL` to the activator URL

Set the environmental variable of `ENVIRONMENT_SELF_URL` to the runtime URL

Set the environmental variable of `NODE_ENV` to `DEV`

Start the runtime by
```
kgrid-node
```



Updated on May 21, 2020
