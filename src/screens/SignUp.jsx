import { useState } from "react";


import Alert from '@mui/material/Alert';
import {sha256} from 'js-sha256';
import { useNavigate } from "react-router-dom";


const BASE_URL_API="http://localhost:3000/api/v1";
const BASE_URL_API_RENDER="http://integridos-backend.onrender.com/api/v1";


function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push(`Debe tener al menos 8 caracteres`);
  }
  if (!/\p{Lu}/u.test(password)) {
    errors.push("Debe contener al menos una mayúscula");
  }
  if (!/\p{Ll}/u.test(password)) {
    errors.push("Debe contener al menos una minuscula");
  }
  if (!/\d/.test(password)) {
    errors.push("Debe contener al menos un número");
  }
  if (!/[^\p{L}\p{N}\s]/u.test(password)) {
    errors.push("Debe contener al menos un carácter especial");
  }

  return { valid: errors.length === 0, errors };
}

export default function SignUp(){

    const navigate=useNavigate()

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
        const { valid, errors } = validatePassword(password);
        if (!valid) {
          setError(errors.join(". "));
          return; // no se envía nada al servidor
        }

        let passwordResume= password;
        for (let i=0; i<3; i++){
          passwordResume= sha256(passwordResume);
        }

        const messageBody={"username":username,"password":passwordResume};
        const data=JSON.stringify(messageBody);

        let nonce=toHex(crypto.getRandomValues(new Uint8Array(32)));
        let timestamp=Date.now()/1000;

        let hmac=await hmacHex(secretKey, `${timestamp}.${nonce}.${data}`);


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
          if(response.status===409) setError("Ese nombre de usuario ya existe");
          if(response.status==201) {
            setError("");
            navigate("/");
            

          }
        }catch(e){
          
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

      <Alert severity="info" sx={{ my: 1 }}>
      La contraseña debe tener entre 8 y 128 caracteres e incluir una mayúscula,
      una minúscula, un número y un carácter especial.
      </Alert>

      <div>
        <label htmlFor="key">Clave Secreta</label>
        <input id="key" type="password" onChange={(event)=>{
          setSecretkey(event.target.value);
        }}/>
      </div>

      <div>
        <button onClick={()=>{handleSendForm()}}>Enviar</button>
      </div>
       

      {error && <Alert severity="error" variant="filled" >{error}</Alert>}
      </>)

      

      
}
