# KGrid Node Runtime

[![GitHub release](https://img.shields.io/github/release/kgrid/kgrid-node-runtime.svg)](https://github.com/kgrid/kgrid-node-runtime/releases/)
[![CircleCI](https://circleci.com/gh/kgrid/kgrid-node-runtime.svg?style=svg)](https://circleci.com/gh/kgrid/kgrid-node-runtime)


KGrid Node Runtime, enabled by node express server


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



Updated on June 23, 2020
