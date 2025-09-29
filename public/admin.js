/* admin.js — admin via API (list, create, update courses; totals) */
function money(n, currency='USD'){ return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n||0); }
(async function(){
  requireRole(['admin','editor']);
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
  const saveBtn = document.createElement('button');
  saveBtn.id='saveCourse'; saveBtn.className='btn'; saveBtn.textContent='Save changes'; saveBtn.style.display='none';
  document.querySelector('#courseFormActions')?.appendChild(saveBtn);
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
    $$('#addCourse').style.display='';
    saveBtn.style.display='none';
    ['#cTitle','#cPrice','#cHours','#cLevel','#cImage','#cDesc'].forEach(s=>{ const el=$$(s); if(el) el.value=''; });
    $$('#cPub').checked = true;
    await refreshCourses();
  });

  await refreshCourses();
})();
