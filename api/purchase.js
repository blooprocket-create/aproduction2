
const {pool}=require('./util/db'); const {json,readJSON}=require('./util/http'); const {getAuth}=require('./util/guard');
module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method Not Allowed'});
  const a=getAuth(req); if(!a) return json(res,401,{error:'Unauthorized'});
  const {courseId}=await readJSON(req);
  if(!courseId) return json(res,400,{error:'courseId required.'});
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    await c.query('INSERT INTO purchases (user_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[a.id,courseId]);
    await c.query('UPDATE courses SET sales=COALESCE(sales,0)+1 WHERE id=$1',[courseId]);
    await c.query('COMMIT');
    return json(res,200,{ok:true});
  } catch(e){ await c.query('ROLLBACK'); throw e; } finally { c.release(); }
};
