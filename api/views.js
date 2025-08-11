'use strict';

const { readWork, writeWork } = require('./_lib');

module.exports = async (req, res) => {

  if (req.method === 'POST') {
    const { id } = req.query;
    const work = await readWork(id);
    if (!work) return res.status(404).json({ error: 'Work not found.' });
    work.views = (work.views || 0) + 1;
    await writeWork(work);
    res.status(200).json({ message: 'View recorded successfully!', views: work.views, workId: id });
    return;
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    const work = await readWork(id);
    if (!work) return res.status(404).json({ error: 'Work not found.' });
    res.status(200).json({ views: work.views || 0, workId: id });
    return;
  }

  res.status(405).send('Method not allowed');
};

