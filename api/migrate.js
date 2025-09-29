
const { pool } = require('../lib/db');
module.exports = async (req, res) => {
  try {
    const c = await pool.connect();
    try {
      await c.query(`
        create table if not exists users (
          id bigserial primary key,
          name text not null,
          email text unique not null,
          role text not null default 'customer',
          password_hash text,
          created_at timestamptz default now()
        );
        create table if not exists courses (
          id bigserial primary key,
          title text not null,
          slug text unique not null,
          description text,
          hours numeric,
          level text,
          price numeric,
          image text,
          published boolean default false,
          sales integer default 0,
          created_at timestamptz default now()
        );
        create table if not exists purchases (
          user_id bigint references users(id) on delete cascade,
          course_id bigint references courses(id) on delete cascade,
          created_at timestamptz default now(),
          primary key (user_id, course_id)
        );
        create table if not exists emails (
          email text primary key,
          created_at timestamptz default now()
        );
      `);
      res.status(200).json({ ok: true });
    } finally { c.release(); }
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'migration failed' }); }
};
