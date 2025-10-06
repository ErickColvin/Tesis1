import React, { useState } from 'react';
import api from '../services/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', { email, password: pass });
      setMsg('Registered');
    } catch (err) {
      setMsg(err?.response?.data?.message || err?.message || 'Error');
    }
  }

  const exampleItems = [{ id: '1', name: 'Item A' }, { id: '2', name: 'Item B' }];

  return (
    <div className="p-6">
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          required
        />
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="password"
          required
        />
        <button type="submit">Register</button>
      </form>
      {msg && <p>{msg}</p>}

      <div className="mt-4">
        <h3>Example list</h3>
        {exampleItems.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  );
}
