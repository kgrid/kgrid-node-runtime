module.exports =  {
    func: ()=>{},
    async: false,
    init(file) {
      this.func = require(file)
      if(this.func.constructor.name === "AsyncFunction"){
        this.async = true
      }
    },
    execute(input) {
      if(this.async){
        return new Promise((resolve,reject)=> {
          this.func(req.body).then(function(data){
            resolve(data)
          }).catch((error)=>{
            reject(error)
          });
        })
      } else {
        return this.func(input)
      }
    },
    isAsync() {
      return this.async
    }
};
