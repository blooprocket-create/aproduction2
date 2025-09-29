
const {pool}=require('./util/db'); const {json,readJSON}=require('./util/http'); const {getAuth,requireRole}=require('./util/guard');
module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method Not Allowed'});
  const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
  if(!requireRole(a,['admin','editor'])) return json(res,403,{error:'Forbidden'});
  const {id,title,description,hours,level,price,image,published}=await readJSON(req);
  if(!id) return json(res,400,{error:'id required'});
  const c=await pool.connect();
  try{
    const r=await c.query('UPDATE courses SET title=COALESCE($2,title), description=COALESCE($3,description), hours=COALESCE($4,hours), level=COALESCE($5,level), price=COALESCE($6,price), image=COALESCE($7,image), published=COALESCE($8,published) WHERE id=$1 RETURNING id,title,slug,description,hours,level,price,image,published,sales',[id,title,description,hours,level,price,image,typeof published==='boolean'?published:null]);
    if(r.rowCount===0) return json(res,404,{error:'Course not found'});
    return json(res,200,{course:r.rows[0]});
  } finally { c.release(); }
};
