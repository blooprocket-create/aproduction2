
const bcrypt=require('bcryptjs');
const {pool}=require('../lib/db'); 
const {json,readJSON}=require('../lib/http'); 
const {getAuth,requireRole}=require('../lib/guard');

module.exports = async (req,res)=>{
  const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
  if(!requireRole(a,['admin'])) return json(res,403,{error:'Forbidden'});

  if(req.method==='GET'){
    const c=await pool.connect(); try{
      const r=await c.query('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 500');
      return json(res,200,{users:r.rows});
    } finally { c.release(); }
  }

  if(req.method==='POST'){
    const {name,email,role='customer',password}=await readJSON(req);
    if(!name||!email) return json(res,400,{error:'Name and email required.'});
    const c=await pool.connect(); try{
      const ex=await c.query('SELECT 1 FROM users WHERE lower(email)=lower($1)',[email]);
      if(ex.rowCount) return json(res,409,{error:'Email already exists'});
      const hash=password?await bcrypt.hash(password,10):null;
      const r=await c.query('INSERT INTO users (name,email,role,password_hash) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,created_at',[name,email,role,hash]);
      return json(res,200,{user:r.rows[0]});
    } finally { c.release(); }
  }

  return json(res,405,{error:'Method Not Allowed'});
};
