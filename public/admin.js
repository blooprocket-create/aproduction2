
function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0); }
function onlyRoles(roles){
  const u=currentUser();
  if(!u){ location.href='login.html?next='+encodeURIComponent(location.pathname); return false; }
  if(roles.length && !roles.includes(u.role)){ alert('No access.'); location.href='index.html'; return false; }
  return true;
}
(async function(){
  if(!onlyRoles(['admin','editor'])) return;
  const $=s=>document.querySelector(s);
  let editingId=null;

  const tabsHTML = `
    <div class="card" style="margin:12px 0">
      <button class="btn" id="tabCourses">Courses</button>
      <button class="btn ghost" id="tabUsers">Users</button>
      <button class="btn ghost" id="tabEmails">Emails</button>
    </div>`;
  document.querySelector('main .section').insertAdjacentHTML('afterbegin', tabsHTML);
  function showTab(name){
    document.getElementById('panelCourses').style.display = name==='courses'?'':'none';
    document.getElementById('panelUsers').style.display   = name==='users'?'':'none';
    document.getElementById('panelEmails').style.display  = name==='emails'?'':'none';
  }
  document.getElementById('tabCourses').onclick=()=>showTab('courses');
  document.getElementById('tabUsers').onclick=()=>showTab('users');
  document.getElementById('tabEmails').onclick=()=>showTab('emails');

  async function refreshCourses(){
    const {courses=[]}=await API.get('courses',true).catch(()=>({courses:[]}));
    const tb=document.querySelector('#courseTable tbody'); tb.innerHTML='';
    window._courses=courses;
    courses.forEach(c=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><b>${c.title}</b><div class="sub">${(c.description||'').slice(0,80)}...</div></td>
        <td>${money(c.price)}</td><td>${c.hours||0}</td><td>${c.level||''}</td><td>${c.published?'Yes':'No'}</td><td>${c.sales||0}</td>
        <td><button class="btn" data-e="${c.id}">Edit</button></td>`;
      tb.appendChild(tr);
    });
    tb.querySelectorAll('[data-e]').forEach(b=>b.addEventListener('click',()=>{
      const id=parseInt(b.getAttribute('data-e'),10); const data=(window._courses||[]).find(x=>x.id===id);
      const $=s=>document.querySelector(s);
      editingId=data.id; $('#cTitle').value=data.title||''; $('#cPrice').value=data.price||0;
      $('#cHours').value=data.hours||0; $('#cLevel').value=data.level||''; $('#cImage').value=data.image||'';
      $('#cDesc').value=data.description||''; $('#cPub').checked=!!data.published;
      document.getElementById('addCourse').style.display='none';
      let save=document.getElementById('saveCourse');
      if(!save){ save=document.createElement('button'); save.id='saveCourse'; save.className='btn'; save.textContent='Save'; document.getElementById('courseFormActions').appendChild(save); save.addEventListener('click', onSave); } else save.style.display='';
      window.scrollTo({top:0,behavior:'smooth'});
    }));
    const totals = courses.reduce((a,c)=>{a.c+=c.sales||0; a.$+= (c.sales||0)*(c.price||0); return a;},{c:0,$:0});
    document.getElementById('salesTotals').innerHTML = `<b>${totals.c}</b> sales — <b>${money(totals.$)}</b> revenue`;
  }
  async function onSave(){
    if(!editingId) return;
    const $=s=>document.querySelector(s);
    const payload = { id:editingId, title:$('#cTitle').value.trim(), price:parseFloat($('#cPrice').value||'0'),
      hours:parseFloat($('#cHours').value||'0'), level:$('#cLevel').value.trim(), image:$('#cImage').value.trim(),
      description:$('#cDesc').value.trim(), published:$('#cPub').checked };
    const out = await API.post('courses', payload, true);
    if(out.error){ alert(out.error); return; }
    editingId=null; document.getElementById('addCourse').style.display='';
    const btn=document.getElementById('saveCourse'); if(btn) btn.style.display='none';
    ['#cTitle','#cPrice','#cHours','#cLevel','#cImage','#cDesc'].forEach(s=>{ const el=$(s); if(el) el.value=''; });
    $('#cPub').checked=true; await refreshCourses();
  }
  document.getElementById('addCourse')?.addEventListener('click', async ()=>{
    const $=s=>document.querySelector(s);
    const t=$('#cTitle').value.trim(); const d=$('#cDesc').value.trim();
    if(!t||!d){ alert('Title & Description required'); return; }
    const out=await API.post('courses', {
      title:t, price:parseFloat($('#cPrice').value||'0'), hours:parseFloat($('#cHours').value||'0'),
      level:$('#cLevel').value.trim(), image:$('#cImage').value.trim(), description:d, published:$('#cPub').checked
    }, true);
    if(out.error){ alert(out.error); return; }
    ['#cTitle','#cPrice','#cHours','#cLevel','#cImage','#cDesc'].forEach(s=>{ const el=$(s); if(el) el.value=''; });
    $('#cPub').checked=true; await refreshCourses();
  });

  async function refreshUsers(){
    const box=document.getElementById('usersBox'); box.innerHTML='';
    const res=await API.get('emails', true).catch(()=>({emails:[]})); // placeholder to avoid admin-only list if not admin
    // if you want admin-only users: swap to 'users' endpoint and ensure you're admin
    const msg=document.createElement('div'); msg.className='sub'; msg.textContent='Users view requires admin role. Use /api/bootstrap to create the first admin.';
    box.appendChild(msg);
  }

  async function refreshEmails(){
    const box=document.getElementById('emailsBox'); box.innerHTML='';
    const res=await API.get('emails', true).catch(()=>({emails:[]}));
    (res.emails||[]).forEach(e=>{
      const row=document.createElement('div'); row.className='card';
      row.textContent = e.email;
      box.appendChild(row);
    });
  }

  await refreshCourses(); await refreshUsers(); await refreshEmails();
  showTab('courses');
})();
