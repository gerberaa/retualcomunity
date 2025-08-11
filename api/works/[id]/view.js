'use strict';

const { createClient } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  const { id } = req.query;
  const kv = createClient();
  const list = await kv.lrange('works', 0, -1);
  const works = list.map(JSON.parse);
  const index = works.findIndex(w => String(w.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Work not found.' });
  works[index].views = (works[index].views || 0) + 1;
  await kv.del('works');
  if (works.length) await kv.rpush('works', ...works.map(JSON.stringify));
  res.status(200).json({ message: 'View recorded successfully!', views: works[index].views, workId: id });
};

