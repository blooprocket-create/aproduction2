/* app.js — storefront driven by Netlify Functions + Postgres */

function money(n, currency='USD'){
  return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n||0);
}

function authHeader(){
  const t = localStorage.getItem('novus:token');
  return t ? { Authorization: 'Bearer ' + t } : {};
}

const API = {
  async _parseJSON(res){
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { throw new Error(`API returned non-JSON (status ${res.status}). First bytes: ${text.slice(0,100)}`); }
  },
  async get(path, auth=false){
    const res = await fetch(`/api/${path}`, { headers: { ...(auth?authHeader():{}) } });
    return this._parseJSON(res);
  },
  async post(path, data, auth=false){
    const res = await fetch(`/api/${path}`, {
      method:'POST',
      headers: { 'Content-Type':'application/json', ...(auth?authHeader():{}) },
      body: JSON.stringify(data||{})
    });
    return this._parseJSON(res);
  }
};

function currentUser(){
  try { return JSON.parse(localStorage.getItem('novus:user')||'null'); }
  catch { return null; }
}

async function getOwnedIds(){
  const t = localStorage.getItem('novus:token');
  if(!t) return new Set();
  const me = await API.get('me', true).catch(()=>null);
  if(me?.owned) return new Set(me.owned.map(c=>c.id));
  return new Set();
}

async function renderCourses(){
  const grid=document.getElementById('courseGrid'); if(!grid) return;
  const { courses=[] } = await API.get('courses-list').catch(()=>({courses:[]}));
  const ownedIds = await getOwnedIds();

  const featured = courses.slice().sort((a,b)=> (b.sales||0)-(a.sales||0)).slice(0,4);
  const toShow = (featured.length?featured:courses).slice(0,4);

  grid.innerHTML = '';
  if(toShow.length===0){
    grid.innerHTML = "<p class='sub'>No courses published yet.</p>";
    return;
  }

  toShow.forEach(c=>{
    const owned = ownedIds.has(c.id);
    const el=document.createElement('div'); el.className='card';
    el.innerHTML=`
      <div style="aspect-ratio:16/9;border-radius:12px;border:1px solid rgba(255,255,255,.1);
        background:linear-gradient(120deg, rgba(125,249,255,.18), transparent 40%), url('${c.image||'assets/course.png'}') center/cover no-repeat"></div>
      <h3>${c.title}</h3>
      <div class="meta">${c.level||""} • ${c.hours||0} hrs</div>
      <p class="sub" style="margin:.5rem 0 0">${c.description||""}</p>
      <div class="flex" style="justify-content:space-between;margin-top:10px">
        <div class="price">${money(c.price)}</div>
        ${owned ? `<button class="btn" disabled>Owned</button>`
                : `<button class="btn" data-buy="${c.id}">Buy</button>`}
      </div>`;
    grid.appendChild(el);
  });

  grid.querySelectorAll('[data-buy]').forEach(btn=>btn.addEventListener('click', async (e)=>{
    const id=e.currentTarget.getAttribute('data-buy');
    const u=currentUser();
    if(!u){
      if(confirm('You need an account to buy. Create one now?')) location.href='register.html?next=account.html';
      return;
    }
    const out = await API.post('purchase', {courseId:id}, true);
    if(out.error){ alert(out.error); return; }
    alert('Access granted! Visit My Courses.');
    location.href='account.html'; // ← fixed redirect
  }));
}

// expose for index.html
window.renderCourses = renderCourses;
