
function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0); }
async function getOwnedIds(){
  const t = localStorage.getItem('novus:token'); if(!t) return new Set();
  const me = await API.get('me', true).catch(()=>null);
  if(me?.owned) return new Set(me.owned.map(c=>c.id));
  return new Set();
}
async function renderFeatured(){
  const wrap=document.getElementById('featuredGrid'); if(!wrap) return;
  const { courses=[] } = await API.get('courses').catch(()=>({courses:[]}));
  const ownedIds = await getOwnedIds();
  const top = courses.slice().sort((a,b)=>(b.sales||0)-(a.sales||0)).slice(0,4);
  wrap.innerHTML='';
  const show = top.length ? top : courses.slice(0,4);
  if(!show.length){ wrap.innerHTML = "<p class='sub'>No courses yet.</p>"; return; }
  show.forEach(c=>{
    const owned = ownedIds.has(c.id);
    const el=document.createElement('div'); el.className='card';
    el.innerHTML = `
      <div class="thumb" style="background-image:url('${c.image||'assets/course.png'}')"></div>
      <h3>${c.title}</h3>
      <div class="sub">${c.level||''} • ${c.hours||0} hrs</div>
      <p class="sub">${(c.description||'').slice(0,160)}...</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <div class="mono">${money(c.price)}</div>
        ${owned?`<a class="btn glitch" data-label="Open" href="account.html">Open</a>`:`<button class="btn glitch" data-label="Buy" data-buy="${c.id}">Buy</button>`}
      </div>`;
    wrap.appendChild(el);
  });
  wrap.querySelectorAll('[data-buy]').forEach(btn=>btn.addEventListener('click', async (e)=>{
    const id = e.currentTarget.getAttribute('data-buy');
    const u = currentUser(); if(!u){ if(confirm('You need an account to buy. Create one now?')) location.href='register.html?next=account.html'; return; }
    const out = await API.post('purchase', {courseId:id}, true);
    if(out?.ok){ alert('Access granted!'); location.href='account.html'; } else { alert(out?.error||'Purchase failed'); }
  }));
}
async function renderCatalog(){
  const grid=document.getElementById('catalogGrid'); if(!grid) return;
  const { courses=[] } = await API.get('courses').catch(()=>({courses:[]}));
  const owned = await getOwnedIds();
  grid.innerHTML='';
  if(!courses.length){ grid.innerHTML="<p class='sub'>No courses yet.</p>"; return; }
  courses.forEach(c=>{
    const el=document.createElement('div'); el.className='card';
    const isOwned = owned.has(c.id);
    el.innerHTML = `
      <div class="thumb" style="background-image:url('${c.image||'assets/course.png'}')"></div>
      <h3>${c.title}</h3>
      <div class="sub">${c.level||''} • ${c.hours||0} hrs</div>
      <p class="sub">${(c.description||'').slice(0,160)}...</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <div class="mono">${money(c.price)}</div>
        ${isOwned?`<a class="btn glitch" data-label="Open" href="account.html">Open</a>`:`<button class="btn glitch" data-label="Buy" data-id="${c.id}">Buy</button>`}
      </div>`;
    grid.appendChild(el);
  });
  grid.querySelectorAll('button[data-id]').forEach(b=>b.addEventListener('click',async e=>{
    const id=e.currentTarget.dataset.id; const u=currentUser();
    if(!u){ if(confirm('Create an account to buy?')) location.href='register.html?next=account.html'; return; }
    const r=await API.post('purchase',{courseId:id},true);
    if(r?.ok){ alert('Access granted!'); location.href='account.html'; } else alert('Error');
  }));
}
