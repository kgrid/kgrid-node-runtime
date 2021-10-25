const servicelist = require('./preventiveservices.json')

async function processservices(inputs){
  let results = []
  let serviceIds= Object.keys(servicelist)
  let pt = fullsetFeatures(inputs.patient)

  for(let i=0; i<serviceIds.length;i++){
    if(servicelist[serviceIds[i]].ko!==""){
      if(checkAppicability(serviceIds[i], inputs.patient.features)){
        let output = await serviceResult(serviceIds[i], pt)
        Object.keys(output).forEach(function(e){
          results.push(packagedOutput(output[e]))
        })
      }else {
        results.push(erroroutput(serviceIds[i], "Not applicable.")[serviceIds[i]])
      }
    }
  }
  /* Sort the result by the order of the QALY gain*/
  results.sort((a,b) => {
    if(a.value==null)  {
      return 1
    }else {
      if(b.value==null){
        return -1
      }else{
        return b.value-a.value
      }
    }
  })
  return results;
}

async function serviceResult(id, input){
  var func = global.cxt.getExecutorByID(servicelist[id].ko.replace("ark:/","")+"/"+servicelist[id].apiversion+servicelist[id].function)
  let output = {}
  if(func!=null) {
    output = await func.execute(input)
    return new Promise(resolve=>{
      resolve(output)
    })
  }else {
    return new Promise(resolve=>{
      resolve(erroroutput(id,"KO not found."))
    })
  }
}

function packagedOutput(output){
  var serviceId = output.service
  if(output.error){
    return output
  } else {
    let obj = {
      id: output.id,
      field: output.field,
      service: output.service,
      value: parseFloat(output.qaly.gain) ,
      title: servicelist[serviceId].title,
      description: servicelist[serviceId].description
  }
    if(process.env.DEBUG){
      obj.qaly =output.qaly
      obj.data_source =output.data_source
    }
    return obj
  }
}

function erroroutput(id, message){
    var obj = {}
    obj[id]={
      "id": id,
      "error":message
    }
    return obj
}

function checkAppicability(id, features) {
  let isApplicable = true;
  switch(id){
    case 'aaa':
      break;
    case 'breast':
      isApplicable = isApplicable && (features.gender==1)
      break;
    case 'cervical':
      isApplicable = isApplicable && (features.gender==1)
      break;
    case 'colorectal':
      break;
    case 'cvd':
      break;
    case 'lung':
      break;
    default:
      isApplicable = true
      break;
  }
  return isApplicable
}

function fullsetFeatures(pt){
  let fullfeatures = {}
  Object.keys(pt.features).forEach(function(e){
    fullfeatures[e]=pt.features[e]
  })
  /** AAA Screening **/
  fullfeatures.cigpackpday=aaa_cigpackpday(fullfeatures.cigpday)
  fullfeatures.smokeyears=aaa_smokeyears(fullfeatures.smokeyear)
  fullfeatures.smokestatus=aaa_smokestatus(fullfeatures.smokeyear, fullfeatures.quityear)
  fullfeatures.bmiover25=aaa_bmiover25(fullfeatures.bmi)
  /** CervC Screening, CRC Screening, CVD **/
  fullfeatures.smoker=cervc_smoker(fullfeatures.smokeyear, fullfeatures.quityear)
  /** CVD Prelim**/
  fullsetFeatures.sbprange = cvd_sbp_range(fullfeatures.sbp)
  fullsetFeatures.tcrange = cvd_tc_range(fullfeatures.tc)
  fullsetFeatures.hdlrange = cvd_hdl_range(fullfeatures.hdl)
  /** CRC Screening**/
  fullfeatures.obesity=crc_obesity(fullfeatures.bmi)
  fullfeatures.BMI_range=osteo_bmi_range(fullfeatures.bmi)
  return {"id":pt.id, "features":fullfeatures}
}

function aaa_cigpackpday(cigpday){
  let cigpackpday = cigpday/20
  if(cigpackpday==0) {
    return 3
  }
  if(cigpackpday<.5) {
    return 2
  }
  if(cigpackpday<=1) {
    return 1
  }
  if(cigpackpday>1) {
    return 0
  }
}

function aaa_smokeyears(smokeyear){
  if(smokeyear==0) {
    return 4
  }
  if(smokeyear<=10) {
    return 3
  }
  if(smokeyear<=20) {
    return 2
  }
  if(smokeyear<=35) {
    return 1
  }
  if(smokeyear>35) {
    return 0
  }
}

function aaa_smokestatus(smokeyear, quityear){
  if(smokeyear==0) {
    return 4
  }
  if(quityear>10) {
    return 3
  }
  if(quityear>5) {
    return 2
  }
  if(quityear < 5  && quityear > 0) {
    return 1
  }
  return 0
}

function aaa_bmiover25(bmi){
  if(bmi>=25) {
    return 1
  } else {
    return 0
  }
}

function cervc_smoker(smokeyear, quityear){
  if(smokeyear>0 && quityear ==0) {
    return 1
  } else {
    return 0
  }
}

function crc_obesity(bmi){
  if(bmi>=30) {
    return 1
  } else {
    return 0
  }

}

function osteo_bmi_range(bmi){
  if(bmi< 15) {
    return 0;
  } else if (bmi < 20){
    return 1
  } else if (bmi < 25){
    return 2
  } else if (bmi < 30){
    return 3
  } else if (bmi < 35){
    return 4
  } else if (bmi < 40){
    return 5
  } else if (bmi < 45){
    return 6
  } else {
    return 7
  }
}

function cvd_sbp_range(sbp){
  if(sbp<100) {
    return 0
  } else if(sbp<=109){
    return 1
  } else if(sbp<=119){
    return 2
  } else if(sbp<=129){
    return 3
  } else if(sbp<=139){
    return 4
  } else if(sbp<=149){
    return 5
  } else if(sbp<=159){
    return 6
  } else {
    return 7
  }
}


function cvd_tc_range(tc){
  if(tc<75) {
    return 0
  } else if(tc<=99){
    return 1
  } else if(tc<=124){
    return 2
  } else if(tc<=149){
    return 3
  } else if(tc<=174){
    return 4
  } else if(tc<=199){
    return 5
  } else if(tc<=224){
    return 6
  }  else if(tc<=249){
    return 7
  } else if(tc<=274){
    return 8
  } else if(tc<=299){
    return 9
  } else {
    return 10
  }
}

function cvd_hdl_range(hdl){
  if(hdl<25) {
    return 0
  } else if(hdl<=49){
    return 1
  } else if(hdl<=74){
    return 2
  } else if(hdl<=99){
    return 3
  } else if(hdl<=124){
    return 4
  } else {
    return 5
  }
}
module.exports = processservices
