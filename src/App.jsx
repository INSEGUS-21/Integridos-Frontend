import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Routes, Route } from "react-router-dom";
import Home from './screens/Home.jsx';
import Login from './screens/Login.jsx';
import SignUp from './screens/SignUp.jsx';
import Transactions from './screens/Transactions.jsx';


export default function App(){
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/sign-up' element={<SignUp/>}/>
      <Route path='/transactions' element={<Transactions/>}/>

    </Routes>
  )
}
