# KGrid Node Runtime

[![GitHub release](https://img.shields.io/github/release/kgrid/kgrid-node-runtime.svg)](https://github.com/kgrid/kgrid-node-runtime/releases/)
[![CircleCI](https://circleci.com/gh/kgrid/kgrid-node-runtime.svg?style=svg)](https://circleci.com/gh/kgrid/kgrid-node-runtime)


KGrid Node Runtime, enabled by node express server

This NodeJS application complies with [KGrid Common Runtime Specification](https://kgrid.org/specs/runtimes.html)

## Installation

```
npm install -g @kgrid/noderuntime

```

## Configuration

Set the environmental variable of `KGRID_ADAPTER_PROXY_URL` to the activator URL.
(Default: http://localhost:8080)

Set the environmental variable of `ENVIRONMENT_SELF_URL` to the runtime URL.
(Default: http://localhost:3000)


## Start the runtime

Start the runtime by
```
kgrid-node
```

Once started, the runtime will register itself with the specified activator and ask the activator to activate all KOs intended for this runtime.


## Runtime Information endpoint

The information about this runtime can be retrieved at `{{url}}/info`
