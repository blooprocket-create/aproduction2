
/* auth.js (Netlify + Postgres) */
const API = {
  base: '',
  async post(path, data, auth=false){
    const res = await fetch(`/api/${path}`, {
      method:'POST',
      headers: { 'Content-Type':'application/json', ...(auth?authHeader():{}) },
      body: JSON.stringify(data||{})
    });
    return res.json();
  },
  async get(path, auth=false){
    const res = await fetch(`/api/${path}`, { headers: { ...(auth?authHeader():{}) } });
    return res.json();
  }
};

function saveSession({token, user}){
  localStorage.setItem('novus:token', token);
  localStorage.setItem('novus:user', JSON.stringify(user));
}
function authHeader(){
  const t = localStorage.getItem('novus:token'); return t? { Authorization: 'Bearer ' + t } : {};
}
function currentUser(){ try{return JSON.parse(localStorage.getItem('novus:user')||'null')}catch{return null} }
function logoutUser(){ localStorage.removeItem('novus:token'); localStorage.removeItem('novus:user'); }

async function registerUser({name,email,password}){
  const out = await API.post('register', {name,email,password});
  if(out.error) throw new Error(out.error);
  saveSession(out); return out.user;
}
async function loginUser({email,password}){
  const out = await API.post('login', {email,password});
  if(out.error) throw new Error(out.error);
  saveSession(out); return out.user;
}
function requireRole(roles){
  const u=currentUser();
  if(!u){ location.href='login.html?next='+encodeURIComponent(location.pathname); return; }
  if(Array.isArray(roles) && roles.length && !roles.includes(u.role)){
    alert('You do not have access to this page.');
    location.href='index.html';
  }
}
function userOwnsCourse(courseId){ /* server validates on course pages; this is unused client-side now */ return true; }
