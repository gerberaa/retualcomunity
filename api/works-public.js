'use strict';

const { createClient } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  const kv = createClient();
  const list = await kv.lrange('works', 0, -1);
  const works = list.map(JSON.parse)
    .filter(w => w.status === 'approved')
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.status(200).json(works);
};

