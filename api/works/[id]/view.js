'use strict';

const { readWork, writeWork } = require('../../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
    res.status(500).send('KV is not configured. Connect Vercel KV in the project.');
    return;
  }
  const { id } = req.query;
  const work = await readWork(id);
  if (!work) return res.status(404).json({ error: 'Work not found.' });
  work.views = (work.views || 0) + 1;
  await writeWork(work);
  res.status(200).json({ message: 'View recorded successfully!', views: work.views, workId: id });
};

