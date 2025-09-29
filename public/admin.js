/* admin.js — Admin via API: list/create/update courses; totals; users list/create */

function money(n, currency='USD'){ return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n||0); }
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
function requireRole(roles){
  const u=currentUser();
  if(!u){ location.href='login.html?next='+encodeURIComponent(location.pathname); return false; }
  if(Array.isArray(roles) && roles.length && !roles.includes(u.role)){
    alert('You do not have access to this page.'); location.href='index.html'; return false;
  }
  return true;
}

(async function(){
  if(!requireRole(['admin','editor'])) return;

  const $$=s=>document.querySelector(s);
  let editingId = null;

  async function refreshCourses(){
    const { courses=[] } = await API.get('courses-list', true);
    const tbody=document.querySelector('#courseTable tbody'); if(!tbody) return; tbody.innerHTML='';
    courses.forEach(c=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><b>${c.title}</b><div class="meta">${(c.description||'').slice(0,80)}...</div></td>
        <td>${money(c.price)}</td><td>${c.hours||0}</td><td>${c.level||''}</td>
        <td>${c.published?'Yes':'No'}</td><td>${c.sales||0}</td>
        <td class="flex">
          <button class="btn ghost" data-edit="${c.id}">Edit</button>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-edit');
      const c=courses.find(x=>x.id===id);
      editingId = c.id;
      $$('#cTitle').value = c.title||'';
      $$('#cPrice').value = c.price||0;
      $$('#cHours').value = c.hours||0;
      $$('#cLevel').value = c.level||'';
      $$('#cImage').value = c.image||'';
      $$('#cDesc').value = c.description||'';
      $$('#cPub').checked = !!c.published;
      $$('#addCourse').style.display='none';
      $$('#saveCourse').style.display='';
      window.scrollTo({top:0, behavior:'smooth'});
    }));

    // totals
    const totals = courses.reduce((acc,c)=>{ acc.count+=(c.sales||0); acc.revenue+=(c.sales||0)*(c.price||0); return acc; }, {count:0,revenue:0});
    let el = document.getElementById('salesTotals'); if(!el){ el=document.createElement('div'); el.id='salesTotals'; el.className='kpi'; document.body.appendChild(el); }
    el.innerHTML = `<h3>${totals.count} sales</h3><p>Total revenue: ${money(totals.revenue)}</p>`;
  }

  // Create course
  document.querySelector('#addCourse')?.addEventListener('click', async ()=>{
    const title=$$('#cTitle').value.trim(), price=parseFloat($$('#cPrice').value||'0'), hours=parseFloat($$('#cHours').value||'0'),
          level=$$('#cLevel').value.trim(), image=$$('#cImage').value.trim(),
          description=$$('#cDesc').value.trim(), published=$$('#cPub').checked;
    if(!title || !description){ alert('Title and Description required.'); return; }
    const out = await API.post('courses-create', { title, price, hours, level, image, description, published }, true);
    if(out.error){ alert(out.error); return; }
    ['#cTitle','#cPrice','#cHours','#cLevel','#cImage','#cDesc'].forEach(s=>{ const el=$$(s); if(el) el.value=''; });
    $$('#cPub').checked = true;
    await refreshCourses();
  });

  // Save edits
  let saveBtn = document.getElementById('saveCourse');
  if(!saveBtn){
    saveBtn = document.createElement('button');
    saveBtn.id='saveCourse'; saveBtn.className='btn'; saveBtn.textContent='Save changes'; saveBtn.style.display='none';
    (document.querySelector('#courseFormActions') || document.body).appendChild(saveBtn);
  }
  saveBtn.addEventListener('click', async ()=>{
    if(!editingId) return;
    const payload = {
      id: editingId,
      title: $$('#cTitle').value.trim(),
      price: parseFloat($$('#cPrice').value||'0'),
      hours: parseFloat($$('#cHours').value||'0'),
      level: $$('#cLevel').value.trim(),
      image: $$('#cImage').value.trim(),
      description: $$('#cDesc').value.trim(),
      published: $$('#cPub').checked
    };
    const out = await API.post('courses-update', payload, true);
    if(out.error){ alert(out.error); return; }
    editingId = null;
    document.querySelector('#addCourse').style.display='';
    saveBtn.style.display='none';
    ['#cTitle','#cPrice','#cHours','#cLevel','#cImage','#cDesc'].forEach(s=>{ const el=$$(s); if(el) el.value=''; });
    $$('#cPub').checked = true;
    await refreshCourses();
  });

  // Users panel
  async function refreshUsers(){
    const out = await API.get('users-list', true).catch(()=>({users:[]}));
    const tbody = document.querySelector('#userTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    (out.users||[]).forEach(u=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${new Date(u.created_at).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  }
  document.querySelector('#addUser')?.addEventListener('click', async ()=>{
    const name = document.getElementById('uName').value.trim();
    const email = document.getElementById('uEmail').value.trim();
    const role = document.getElementById('uRole').value.trim() || 'customer';
    const pw   = (document.getElementById('uPassword')?.value||'').trim() || '';
    if(!name || !email){ alert('Name and Email required.'); return; }
    const out = await API.post('users-create', { name, email, role, password: pw }, true);
    if(out.error){ alert(out.error); return; }
    ['uName','uEmail','uRole','uPassword'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    await refreshUsers();
  });

  await refreshCourses();
  await refreshUsers();
})();
