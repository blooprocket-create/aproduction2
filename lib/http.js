
function json(res, s, b, h={}){
  res.status(s);
  for(const [k,v] of Object.entries({'Content-Type':'application/json','Cache-Control':'no-store',...h})) res.setHeader(k,v);
  res.send(JSON.stringify(b));
}
async function readJSON(req){ return req.body ?? {}; }
module.exports = { json, readJSON };
