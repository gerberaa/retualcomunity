'use strict';

const { createClient } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  const { id } = req.query;
  const kv = createClient();
  const list = await kv.lrange('works', 0, -1);
  const works = list.map(JSON.parse);
  const work = works.find(w => String(w.id) === String(id));
  if (!work) return res.status(404).json({ error: 'Work not found.' });
  res.status(200).json({ views: work.views || 0, workId: id });
};

