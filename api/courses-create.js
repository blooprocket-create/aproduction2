
const {pool}=require('./util/db'); const {json,readJSON}=require('./util/http'); const {getAuth,requireRole}=require('./util/guard');
module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method Not Allowed'});
  const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
  if(!requireRole(a,['admin','editor'])) return json(res,403,{error:'Forbidden'});
  const {title,description,hours,level,price,image,published}=await readJSON(req);
  if(!title) return json(res,400,{error:'Title required.'});
  const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const c=await pool.connect();
  try{
    const r=await c.query('INSERT INTO courses (title, slug, description, hours, level, price, image, published, sales) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0) RETURNING id,title,slug,description,hours,level,price,image,published,sales',[title,slug,description||'',hours||0,level||'',price||0,image||'',!!published]);
    return json(res,200,{course:r.rows[0]});
  } finally { c.release(); }
};
