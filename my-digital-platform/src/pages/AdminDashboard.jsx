import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ async function load(){ try{ const r=await api.get('/api/admin/users'); setUsers(r.data); }catch(err){ console.error(err); } finally{ setLoading(false); } } load(); },[]);
  async function toggleAdmin(id,currentRole){ const newRole = currentRole==='admin' ? 'user' : 'admin'; await api.patch(`/api/admin/users/${id}/role`, { role: newRole }); setUsers(u=>u.map(x=>x._id===id?{...x,role:newRole}:x)); }
  if(loading) return <div>Loading...</div>;
  return (<div className="p-6"><h2>Admin</h2><table><thead><tr><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>{users.map(u=> (<tr key={u._id}><td>{u.email}</td><td>{u.role}</td><td><button onClick={()=>toggleAdmin(u._id,u.role)}>{u.role==='admin'?'Revoke admin':'Make admin'}</button></td></tr>))}</tbody></table></div>);
}
