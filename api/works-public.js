'use strict';

const { listWorkBlobs, readWork } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  try {
    const blobs = await listWorkBlobs();
    const items = await Promise.all(blobs.map(b => readWork(b.pathname.replace(/^.*\//, '').replace(/\.json$/, ''))));
    const works = (items.filter(Boolean))
      .filter(w => w.status === 'approved')
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.status(200).json(works);
  } catch (e) {
    if (e && e.code === 'NO_BLOB_TOKEN') {
      res.status(200).json([]);
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to read works' });
  }
};

