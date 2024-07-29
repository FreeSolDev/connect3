window.toasts=function(data){
  if(data.type=="good"){
    toast.success(data.message,{ theme: { type: 'dark' }})
  }else if(data.type=="bad"){
    if(Connect3.isValidJSON(data.message)){
      toast.error(JSON.stringify(data.message),{ theme: { type: 'dark' }})
    }else{
      toast.error(data.message,{ theme: { type: 'dark' }})
    }
  }else if(data.type=="promise"){
    toast.promise(
    new Promise(async (resolve, reject) => {
      if(data.params){
        await data.request(data.params).then((x)=>{
        if(x.err){
          reject(data.call?data.call(x.err):console.log(x.err))
        }else{
          resolve(data.call?data.call(x.res):console.log(x.res))
        }
      })
      }else{
        await data.request().then((x)=>{
        if(x.err){
          reject(data.call?data.call(x.err):console.log(x.err))
        }else{
          resolve(data.call?data.call(x.res):console.log(x.res))
        }
      })
      }

    }),
    {
      loading: !data.req?'Request Processing...':data.req,
      success: !data.suc?'Succesfully Processed Request':data.suc,
      error: !data.er?'Failed to Process Request':data.er,
      theme: { type: 'dark' }
    }
  );
  }
}
