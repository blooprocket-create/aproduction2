
module.exports = async (req, res) => {
  const hasDb = !!process.env.DATABASE_URL;
  const hasJwt = !!process.env.JWT_SECRET;
  res.status(200).json({
    ok: true,
    env: {
      DATABASE_URL: hasDb ? 'set' : 'missing',
      JWT_SECRET: hasJwt ? 'set' : 'missing'
    }
  });
};
