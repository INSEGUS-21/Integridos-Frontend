import { useState } from "react";
import { useNavigate } from "react-router";
import { sha256 } from 'js-sha256';

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Login(){
  
  const BASE_API= "https://integridos-backend.onrender.com/api/v1";
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [secretKey, setSecretKey] = useState("");

  async function getSalt(user){
    try {
      
      const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));
      const timestamp = Date.now()/1000;


      const hmac = sha256.hmac(secretKey, `${timestamp}.${nonce}`);
      const res = await fetch(BASE_API+`/getUserSalt/${user}`, {method: "GET",
                  headers: {'Content-Type': 'application/json',
                    'nonce':nonce,
                    'timestamp':String(timestamp),
                    'hmac': hmac}
                }                  
      );
      let data= await res.json();
      return data.salt;

    }catch(err){
      setError("No se pudo conectar con el servidor");

    }

  }

  async function login() {

    //nonce

    const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const timestamp = Date.now()/1000;

    let salt = await getSalt(username);
    let password_resume = password + String(salt);
    for (let i=0; i<3; i++){
      //pal hash de la contraseña 3 vece
      password_resume=sha256(password_resume);
    }


    //el hmac del body + clave
    const body= JSON.stringify({ "username":username, "password": password_resume });
    const hmac = sha256.hmac(secretKey, `${timestamp}.${nonce}.${salt}.${body}`);

    try{const res = await fetch(BASE_API+"/login", {method: "POST",
                  headers: {'Content-Type': 'application/json',
                    'nonce':nonce,
                    'timestamp':String(timestamp),
                    'hmac': hmac}, 
                  body: body
                }                  
      );

      if (!res.ok) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      const data = await res.json(); //respuesta del backend al post que trae el token
      console.log(data) //pa depurar  
      localStorage.setItem("token", data.token);
      navigate("/transactions")


    }catch(err){
      setError("No se pudo conectar con el servidor");

    }
  }

  return (   
      <>
      <h1>Login</h1>
      <form>

        <label htmlFor="secretKey">SecretKey:</label><br />
        <input type="password" id="secretKey" name="secretKey" onChange = {(event) => setSecretKey(event.target.value)} /><br />
      
        <label htmlFor="username">Username:</label><br />
        <input type="text" id="username" name="username" onChange = {(event) => setUsername(event.target.value)} /><br />

        <label htmlFor="password">Password:</label><br />
        <input type="password" id="password" name="password" onChange = {(event) => setPassword(event.target.value)} /><br />
        <button type="button" onClick={login}>Entrar</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </>
    )



}

