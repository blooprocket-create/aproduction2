
const {pool}=require('../lib/db'); const {json}=require('../lib/http'); const {getAuth}=require('../lib/guard');
module.exports = async (req,res)=>{
  const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
  const c=await pool.connect();
  try{
    const me=await c.query('SELECT id,name,email,role FROM users WHERE id=$1',[a.id]);
    const owned=await c.query('SELECT c.id,c.title,c.slug,c.price,c.level,c.hours,c.image FROM purchases p JOIN courses c ON c.id=p.course_id WHERE p.user_id=$1 ORDER BY p.created_at DESC',[a.id]);
    return json(res,200,{user:me.rows[0],owned:owned.rows});
  } finally { c.release(); }
};
