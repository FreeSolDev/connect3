window.Connect3={
	PublicKey:"",
	Provider:null,
  Connection:null,
  Version:"1.7.0",
  isValidJSON:str => { try { JSON.parse(str); return true; } catch (e) { return false; } },
  isBase64:str => /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str),  
  Initalize:(x="https://mainnet.helius-rpc.com/?api-key=[HELIUS API KEY]")=>{
    toasts({type:"good",message:`Connect 3 Initalized ${Connect3.Version}`})
    Connect3.Connection=new solanaWeb3.Connection(x)

  },
  WalletProvider:async (x) => {
    const isBackpackInstalled = window.backpack && window.backpack.isBackpack;
    const isSolflareInstalled = window.solflare && window.solflare.isSolflare;
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    if (window.self !== window.top){
    	return "iframe"
    }
    if (isBackpackInstalled && x == "backpack") {
      return window.backpack;
    }
    else if (isSolflareInstalled && x == "solflare") {
      return window.solflare;
    } 
    else if (isPhantomInstalled && x == "phantom") {
      return window.solana;
    } 
},
  Connect:async (provider_name,onconnect)=>{
    Connect3.Provider = await Connect3.WalletProvider(provider_name);
    	if(Connect3.Provider=="iframe"){
      toasts({type:"bad",message:"This page is currently in a iframe,Wallets unavailable"})
      }else{
           if (typeof  Connect3.Provider == "undefined") {
            let app_link;
                if(provider_name=="solflare"){
                  app_link = "https://solflare.com/ul/v1/browse/"+encodeURIComponent("https://"+window.location.hostname+window.location.pathname+"#connect_3-solflare")+"?ref="+encodeURIComponent("https://"+window.location.hostname);
                }
                else if(provider_name=="phantom"){
                  app_link = "https://phantom.app/ul/browse/"+encodeURIComponent("https://"+window.location.hostname+window.location.pathname+"#connect_3-phantom")+"?ref="+encodeURIComponent("https://"+window.location.hostname);

                }else if(provider_name=="backpack"){
									window.open('https://www.backpack.app/downloads','_blank')
                }
            
              if(provider_name=="solflare" || provider_name=="phantom"){
                let a = document.createElement('a');
                a.id = "connect_3_deep";
                a.href = app_link;
                document.body.appendChild(a);
                a.click(); a.remove();
                connect_3_cover.style.display = "none";
                connect_3_cover.style.opacity = 0;
                connect_3_chooser.style.display = "none";
                connect_3_chooser.style.opacity = 0;
                document.getElementById("connect_3_message").innerHTML = "";
              }   
        }else {
            if (Connect3.Provider.isConnected === false) {
                  $("#connect_3_chooser").fadeOut()
                  document.getElementById("connect_3_message").innerHTML = "Requesting Connection...";
                  await Connect3.Provider.connect()
                  .then((b)=>{
                  	Connect3.PublicKey=b.publicKey.toString()
                  })
                  .catch(function(err) {
                    $("#connect_3_cover").fadeOut()
                    document.getElementById("connect_3_message").innerHTML = "";
                  });
                }
                if (Connect3.Provider.isConnected === true) {
                  $(".connect_3_button").hide()
                  $(".disconnect_3_button").show()
                  toasts({type:"good",message:`Succesfully Connected ${Connect3.PublicKey.slice(0, 10)}...`})
                  //toasts({type:"promise",request:dosomeshitthatneedsxyz,params:{age:4,name:"John"}})
                  $("#connect_3_cover").fadeOut()
                  $("#connect_3_chooser").fadeOut()
                  if(onconnect){
                    onconnect({
                      publicKey: Connect3.PublicKey
                    })
                  }
                  document.getElementById("connect_3_message").innerHTML = "";
                }
              }       
      }
  
    },
  SignMessage:async (message)=>{
		const encodedMessage = new TextEncoder().encode(message);
		let signedMessage 
    	try{
      signedMessage= await Connect3.Provider.signMessage(encodedMessage, "utf8");
      }catch(e){
      toasts({type:"bad",message:e})
      return false
      } finally{
      toasts({type:"good",message:`Succesfully Signed the Message`})
      return {signed:true,message:signedMessage}
      }
    },
  SignAndSendTransaction:async (transaction,success,failur)=>{

      let blockhash= (await Connect3.Connection.getLatestBlockhash('confirmed')).blockhash;
      let blockheight=(await Connect3.Connection.getEpochInfo("confirmed")).blockHeight
      if(Connect3.isBase64(transaction)){ 

        try{
          transaction=solanaWeb3.Transaction.from(Buffer.from(transaction, 'base64'));
        console.log(`Deserializing Transaction`)
        }catch(e){
          const TransactionBuf = Buffer.from(transaction, 'base64');
          transaction=solanaWeb3.VersionedTransaction.deserialize(TransactionBuf);
          console.log(`Deserializing Versioned Transaction`)
        }
      transaction.recentBlockhash =blockhash
      transaction.lastValidBlockHeight=blockheight
      console.log(transaction)
      let simulation=await Connect3.Connection.simulateTransaction(transaction)
      if(simulation.value.err){
        toasts({type:"bad",message:simulation.value.err})
      }else{
        let tx=await Connect3.Provider.signAndSendTransaction(transaction,Connect3.Connection,{maxRetries: 20}).then((x)=>{
        toasts({type:"good",message:`Transaction Sent`})
        if(success){
          success({tx:x})
        }else{
          console.log({success:true,tx:x})
        }
      }).catch((e)=>{
        toasts({type:"bad",message:e})
        let parse=String(e)
        if(parse.split(":")[1]==" User rejected the request."){
          if(failur){
            failur()
          }
          toasts({type:"bad",message:"User Rejected Transaction"})
      }
      })
      }

    }else if(Array.isArray(transaction)){
        console.log(transaction)
      let arrayoftransactions=[]
      let temptransaction
      transaction.forEach(async (x)=>{
        try{
          temptransaction=solanaWeb3.Transaction.from(Buffer.from(x, 'base64'));
          arrayoftransactions.push(temptransaction)
        console.log(`Deserializing Transaction`)
        }catch(e){
          const TransactionBuf = Buffer.from(x, 'base64');
          temptransaction=solanaWeb3.VersionedTransaction.deserialize(TransactionBuf);
          arrayoftransactions.push(temptransaction)
          console.log(`Deserializing Versioned Transaction`)
        }
      })
       const tx =await Connect3.Provider.signAndSendAllTransactions(arrayoftransactions,Connect3.Connection,{maxRetries: 20}).then((x)=>{
        toasts({type:"good",message:`Transaction Sent`})
        if(success){
          success({tx:x})
        }else{
          console.log({success:true,tx:x})
        }
      }).catch((e)=>{
        toasts({type:"bad",message:e})
        let parse=String(e)
        if(parse.split(":")[1]==" User rejected the request."){
          if(failur){
            failur()
          }
          toasts({type:"bad",message:"User Rejected Transaction"})
      }
      })
      
    }else {
        toasts({type:"bad",message:transaction.error})
    }
    },
  }
