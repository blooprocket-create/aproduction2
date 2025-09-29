
const {pool}=require('./util/db'); const {json}=require('./util/http'); const {getAuth,requireRole}=require('./util/guard');
module.exports = async (req,res)=>{
  const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
  if(!requireRole(a,['admin'])) return json(res,403,{error:'Forbidden'});
  const c=await pool.connect(); try{
    const r=await c.query('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 500');
    return json(res,200,{users:r.rows});
  } finally { c.release(); }
};
