
const {pool}=require('../lib/db'); 
const {json,readJSON}=require('../lib/http'); 
const {getAuth,requireRole}=require('../lib/guard');

module.exports = async (req,res)=>{
  if(req.method==='GET'){
    const onlyPub = (req.query?.published ?? 'true') !== 'false';
    const c=await pool.connect();
    try{
      const r=await c.query(`SELECT id,title,slug,description,hours,level,price,image,published,sales FROM courses ${onlyPub?'WHERE published=true':''} ORDER BY sales DESC NULLS LAST, title ASC LIMIT 200`);
      return json(res,200,{courses:r.rows});
    } finally { c.release(); }
  }
  if(req.method==='POST'){
    const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
    if(!requireRole(a,['admin','editor'])) return json(res,403,{error:'Forbidden'});
    const {id,title,description,hours,level,price,image,published}=await readJSON(req);
    const c=await pool.connect();
    try{
      if(id){ // update
        const r=await c.query('UPDATE courses SET title=COALESCE($2,title), description=COALESCE($3,description), hours=COALESCE($4,hours), level=COALESCE($5,level), price=COALESCE($6,price), image=COALESCE($7,image), published=COALESCE($8,published) WHERE id=$1 RETURNING id,title,slug,description,hours,level,price,image,published,sales',[id,title,description,hours,level,price,image,typeof published==='boolean'?published:null]);
        if(r.rowCount===0) return json(res,404,{error:'Course not found'});
        return json(res,200,{course:r.rows[0]});
      } else { // create
        if(!title) return json(res,400,{error:'Title required.'});
        const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
        const r=await c.query('INSERT INTO courses (title, slug, description, hours, level, price, image, published, sales) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0) RETURNING id,title,slug,description,hours,level,price,image,published,sales',[title,slug,description||'',hours||0,level||'',price||0,image||'',!!published]);
        return json(res,200,{course:r.rows[0]});
      }
    } finally { c.release(); }
  }
  return json(res,405,{error:'Method Not Allowed'});
};
