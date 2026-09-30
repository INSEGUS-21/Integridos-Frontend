import { useState } from "react";


import Alert from '@mui/material/Alert';



const BASE_URL_API="http://localhost:3000/api/v1";

export default function SignUp(){

    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");

    const [secretKey, setSecretkey]=useState("");
    const [error,setError]=useState("");

    const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

    async function hmacHex(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
    return toHex(signature);
    }

    const handleSendForm=async ()=>{

        let passwordResume1=await hmacHex(secretKey, password);
        let passwordResume2=await hmacHex(secretKey, passwordResume1);
        let passwordResume3=await hmacHex(secretKey, passwordResume2);


        const messageBody={"username":username,"password":passwordResume3};
        const data=JSON.stringify(messageBody);

        let nonce=toHex(crypto.getRandomValues(new Uint8Array(32)));
        let timestamp=Date.now();

        let hmac=await hmacHex(secretKey, `${timestamp}.${nonce}${data}`);

        try{
          let response=await fetch(BASE_URL_API+"/register",{method:'POST',
            body:data,
            headers:{"Content-Type":"application/json", 
              "nonce":nonce,
              "timestamp":String(timestamp),
              "hmac":hmac}
            
          });
          if(response.status===403) setError("Se ha detectado un problema de integridad, revisa la clave secreta porfavor");
          if(response.status===400) setError("Falta el nombre de usuario o la contraseña");
        }catch(e){
          console.log(e);
          setError("Ha ocurrido un error en el envío");
        }



      }

    

    return (<>
      <h1>Register</h1>
      
      <div>
        <label htmlFor="username">Nombre </label>

        <input type="text" id="username" onChange={(event)=>{
          setUsername(event.target.value);

        }}/>

      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" onChange={(event)=>{
          setPassword(event.target.value);
        }}/>
      </div>

      <div>
        <label htmlFor="key">Clave Secreta</label>
        <input id="key" type="password" onChange={(event)=>{
          setSecretkey(event.target.value);
        }}/>
      </div>

      <div>
        <button onClick={()=>{handleSendForm()}}>Enviar</button>
      </div>

      {error && <Alert severity="error" >{error}</Alert>}
      </>)

      

      
}
