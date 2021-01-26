// k6 run -e ACTIVATOR_URL=http://localhost:8080 SERVICE_ENDPOINT=/99999/cvd/1.0/qalygain k6post-service.js -u 5 -i 100
import http from "k6/http";
import {Counter, Rate} from "k6/metrics";

let counter503 = new Counter("Number of 503");
let counter200 = new Counter("Number of 200");
let okRate = new Rate('Percentage ok');

export default function() {
  let activator_url = __ENV.ACTIVATOR_URL || "http://localhost:8080";
  let service_endpoint = __ENV.SERVICE_ENDPOINT || "/refresh/node/simple/v1.0";
  var params =  { headers: { "Content-Type": "application/json" } }
  if(activator_url.endsWith("/")){
    activator_url = activator_url.substr(0, activator_url.length-1)
  }
  if(!service_endpoint.startsWith("/")){
    service_endpoint = "/"+service_endpoint
  }
  var url = activator_url+ service_endpoint;
  let res = http.get(url, params);
  if(res.status === 503){
    counter503.add(1);
    okRate.add(0);
  } else if(res.status === 200){
    counter200.add(1);
    okRate.add(1);
  }
};
