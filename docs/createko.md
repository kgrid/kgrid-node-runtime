# Create Knowledge Object

[![GitHub release](https://img.shields.io/github/release/kgrid/kgrid-node-runtime.svg)](https://github.com/kgrid/kgrid-node-runtime/releases/)
[![CircleCI](https://circleci.com/gh/kgrid/kgrid-node-runtime.svg?style=svg)](https://circleci.com/gh/kgrid/kgrid-node-runtime)

This guide will demonstrate how to create a Knowledge Object (KO) for the KGrid Node Runtime. Please refer to KGrid [Knowledge Object Common Model](https://kgrid.org/specs) for more details of KO.

The instructions will utilize [KGrid CLI](https://www.npmjs.com/package/@kgrid/cli) and assume that the reader is familiar with the generic KO creation process described in [Developer's Guide](https://kgrid.org/guides/developer/).

## Create KO

Open a terminal tab or window and navigate to the folder where you will store the KO to be created.

Create a new KO using the kgrid-cli.

You will be prompted for a target runtime. For the node runtime, select `NodeJS`.

``` bash
> kgrid create myobject
KGrid CLI v0.5.1

? Please select the target runtime:  (Use arrow keys)
> Nashorn
  NodeJS
```

Once you select `NodeJS` as the target runtime, the knowledge object will be created.


```bash
? Please select the target runtime:  NodeJS

The knowledge object 99999/myobject has been created.

Please go to the folder by `cd myobject`.

Run `npm install` before deploying to the activator.
```

## Deployment description

`deployment.yaml` provides the KO's deployment description to the activator.  The activator will then locate the suitable runtime (defined as `engine`) and activate the KO via the specified adapter.

`artifact` lists all the source files needed for the activated KO.

`function` specifies the 'main' function where code execution begins

`entry` specifies the code file containing the main function

``` yaml
endpoints:
  /welcome:
    artifact:
      - src/index.js
    adapter: PROXY
    engine: node
    entry: src/index.js
    function: welcome
```


## Function Code in the entry file

The KO created from the template has all the necessary files and can be activated in the KGrid Activator with the registered KGrid Node Runtime.

In the entry file `src/index.js`, you will specify the function to be activated for the endpoint, for example, the function of `welcome` from the template.

``` javascript
function welcome(inputs){
  name = inputs.name;
  return "Welcome to Knowledge Grid, " + name;
 }
module.exports = welcome;
```

`function` and `entry` need to be updated in `deployment.yaml` to match your KO code.


## Additional source files
You can have multiple source files for your KO. Make sure to add them to the list of `artifact` in `deployment.yaml`


## Dependencies
You can use dependencies for your KO by adding them to `package.json` just as you would do for a NodeJS project.

Make sure to add `package.json` to the list of `artifact` in `deployment.yaml` if it is not listed yet. The runtime will need the information to install the dependencies during the activation process.


## What's next?
Now the KO has all the code, with the updated service description and deployment description. Activate it in the KGrid Activator and see it work. Don't forget to start the KGrid Node Runtime too.
