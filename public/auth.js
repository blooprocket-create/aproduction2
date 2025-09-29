
const API = {
  async _parseJSON(res){ const t=await res.text(); try { return JSON.parse(t); } catch { throw new Error(`API non-JSON (status ${res.status}) => ${t.slice(0,120)}`);} },
  async get(p, a=false){ const r = await fetch(`/api/${p}`, { headers: { ...(a?authHeader():{}) } }); return this._parseJSON(r); },
  async post(p, d, a=false){ const r = await fetch(`/api/${p}`, { method:'POST', headers:{'Content-Type':'application/json', ...(a?authHeader():{})}, body: JSON.stringify(d||{}) }); return this._parseJSON(r); }
};
function currentUser(){ try { return JSON.parse(localStorage.getItem('novus:user')||'null'); } catch { return null; } }
function authHeader(){ const t=localStorage.getItem('novus:token'); return t?{Authorization:'Bearer '+t}:{ }; }
function logoutUser(){ localStorage.removeItem('novus:token'); localStorage.removeItem('novus:user'); location.href='index.html'; }
function initNav(){
  const u = currentUser();
  const nav = document.querySelector('nav.flex');
  if(!nav) return;
  nav.innerHTML = `
    <a class="glitch" data-label="Courses" href="catalog.html">Courses</a>
    <a id="accountLink" class="glitch" data-label="Account" href="account.html" style="display:none">Account</a>
    <a id="adminLink" class="btn ghost glitch" data-label="Control Panel" href="admin.html" style="display:none">Control Panel</a>
    <a id="loginLink" class="btn glitch" data-label="Login" href="login.html">Login</a>`;
  const login = document.getElementById('loginLink');
  const acct  = document.getElementById('accountLink');
  const admin = document.getElementById('adminLink');
  if(u){
    acct.style.display='';
    login.dataset.label = `Logout (${u.name||'Account'})`;
    login.textContent = `Logout (${u.name||'Account'})`;
    login.href = '#';
    login.onclick = (e)=>{ e.preventDefault(); logoutUser(); };
    if(u.role==='admin' || u.role==='editor') admin.style.display='';
  }
}
document.addEventListener('DOMContentLoaded', initNav);
