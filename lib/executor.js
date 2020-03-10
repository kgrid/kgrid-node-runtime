module.exports =  {
    func: ()=>{},
    async: false,
    init(file) {
      try{
        this.func = require(file)
        if(this.func.constructor.name === "AsyncFunction"){
          this.async = true
        }
        return true
      } catch(error){
        return false
      }
    },
    execute(input) {
      if(this.async){
        return new Promise((resolve,reject)=> {
          this.func(input).then(function(data){
            resolve(data)
          }).catch((error)=>{
            reject(error)
          });
        })
      } else {
        return new Promise((resolve,reject)=> {
          try {
            resolve(this.func(input))
          }
          catch(error){
            reject(error)
          };
        })
      }
    },
    isAsync() {
      return this.async
    }
};
