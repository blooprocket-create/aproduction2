
const {pool} = require('../lib/db');
const {sign} = require('../lib/jwt');

module.exports = async (req,res)=>{
  try{
    const c = await pool.connect();
    try{
      const admins = await c.query("select count(*)::int as n from users where role='admin'");
      if(admins.rows[0].n > 0){
        return res.status(200).json({ ok:true, info:'admin already exists' });
      }
      const u = await c.query("select id,name,email from users order by created_at desc limit 1");
      if(u.rowCount===0){
        return res.status(400).json({ error:'no users exist; create an account first at /register.html' });
      }
      const user = u.rows[0];
      await c.query("update users set role='admin' where id=$1",[user.id]);
      const cc = await c.query("select count(*)::int as n from courses");
      if(cc.rows[0].n===0){
        await c.query("insert into courses (title, slug, description, hours, level, price, image, published, sales) values ($1,$2,$3,$4,$5,$6,$7,$8,0)",
          ['AI Website with Vercel + Neon','ai-website-vercel-neon','Build a full-stack AI-enabled site with auth, RBAC, and serverless APIs.',4,'Beginner',49,'/assets/course.png',true]);
      }
      const token = sign({ id:user.id, email:user.email, name:user.name, role:'admin' });
      return res.status(200).json({ ok:true, promoted:user.email, token });
    } finally { c.release(); }
  } catch(e){ console.error(e); res.status(500).json({ error:e.message||'bootstrap failed' }); }
};
