'use strict';

const basicAuth = require('basic-auth');
const { createClient } = require('@vercel/kv');

function unauthorized(res) {
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
  res.status(401).send('Authentication required.');
}

function auth(req, res) {
  const user = basicAuth(req);
  const ADMIN_USER = process.env.ADMIN_USER || '401483';
  const ADMIN_PASS = process.env.ADMIN_PASS || '401483';
  if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASS) return false;
  return true;
}

module.exports = async (req, res) => {
  if (req.method !== 'DELETE') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!auth(req, res)) return unauthorized(res);

  const kv = createClient();
  const { id } = req.query;
  const list = await kv.lrange('works', 0, -1);
  const works = list.map(JSON.parse);
  const index = works.findIndex(w => String(w.id) === String(id));
  if (index === -1) return res.status(404).send('Work not found.');
  works.splice(index, 1);
  await kv.del('works');
  if (works.length) await kv.rpush('works', ...works.map(JSON.stringify));
  res.status(200).json({ message: 'Work deleted successfully!' });
};

