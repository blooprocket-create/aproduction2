
const {pool}=require('./util/db'); const {json,readJSON}=require('./util/http');
module.exports = async (req,res)=>{
  if(req.method==='POST'){
    const {email}=await readJSON(req); if(!email) return json(res,400,{error:'Email required'});
    const c=await pool.connect(); try{ await c.query('INSERT INTO emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',[email]); return json(res,200,{ok:true}); } finally{ c.release(); }
  }
  if(req.method==='GET'){
    const c=await pool.connect(); try{ const r=await c.query('SELECT email, created_at FROM emails ORDER BY created_at DESC LIMIT 500'); return json(res,200,{emails:r.rows}); } finally{ c.release(); }
  }
  return json(res,405,{error:'Method Not Allowed'});
};
