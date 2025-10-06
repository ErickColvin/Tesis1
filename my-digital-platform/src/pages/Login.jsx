
import React, { useState } from 'react';
import api, { setAuthToken } from '../services/api';

export default function Login({ onLogin }) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState('');
  const [msg,setMsg]=useState(null);
  async function submit(e){ e.preventDefault(); try{ const r=await api.post('/api/auth/login',{ email, password: pass }); const { token, user } = r.data; localStorage.setItem('token', token); setAuthToken(token); onLogin(user); }catch(err){ setMsg(err.response?.data?.message||err.message); } }
  return (<div className="p-6"><h2>Login</h2><form onSubmit={submit}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" /><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="password"/><button>Login</button></form>{msg && <p>{msg}</p>}</div>);
}
