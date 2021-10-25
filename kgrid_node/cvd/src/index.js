const qalyoutcome = require('@kgrid/qalyutil/qalyoutcome')
const config = require('./config.json')

function qalygain(inputs){
  let output = qalyoutcome(__dirname, config, inputs)
  return output
}

module.exports= qalygain
