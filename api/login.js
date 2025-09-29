
const bcrypt=require('bcryptjs');
const {pool}=require('../lib/db'); const {json,readJSON}=require('../lib/http'); const {sign}=require('../lib/jwt');
module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method Not Allowed'});
  const {email,password}=await readJSON(req);
  if(!email||!password) return json(res,400,{error:'Email and password required.'});
  const c=await pool.connect();
  try{
    const r=await c.query('SELECT id,name,email,role,password_hash FROM users WHERE lower(email)=lower($1)',[email]);
    if(r.rowCount===0) return json(res,401,{error:'Invalid credentials.'});
    const u=r.rows[0]; const ok=await bcrypt.compare(password,u.password_hash||'');
    if(!ok) return json(res,401,{error:'Invalid credentials.'});
    const token=sign({id:u.id,role:u.role,email:u.email,name:u.name});
    return json(res,200,{user:{id:u.id,name:u.name,email:u.email,role:u.role},token});
  } finally { c.release(); }
};
