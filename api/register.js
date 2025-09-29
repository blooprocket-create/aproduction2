
const bcrypt=require('bcryptjs');
const {pool}=require('./util/db'); const {json,readJSON}=require('./util/http'); const {sign}=require('./util/jwt');
module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method Not Allowed'});
  const {name,email,password}=await readJSON(req);
  if(!name||!email||!password) return json(res,400,{error:'Name, email, and password are required.'});
  const c=await pool.connect();
  try{
    const ex=await c.query('SELECT id FROM users WHERE lower(email)=lower($1)',[email]);
    if(ex.rowCount>0) return json(res,409,{error:'Email already registered.'});
    const hash=await bcrypt.hash(password,10);
    const r=await c.query('INSERT INTO users (name,email,role,password_hash) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role',[name,email,'customer',hash]);
    const u=r.rows[0]; const token=sign({id:u.id,role:u.role,email:u.email,name:u.name});
    return json(res,200,{user:u,token});
  } finally { c.release(); }
};
