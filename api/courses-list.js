
const {pool}=require('./util/db'); const {json}=require('./util/http');
module.exports = async (req,res)=>{
  const onlyPub = (req.query?.published ?? 'true') !== 'false';
  const c=await pool.connect();
  try{
    const r=await c.query(`SELECT id,title,slug,description,hours,level,price,image,published,sales FROM courses ${onlyPub?'WHERE published=true':''} ORDER BY sales DESC NULLS LAST, title ASC LIMIT 200`);
    return json(res,200,{courses:r.rows});
  } finally { c.release(); }
};
