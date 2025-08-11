'use strict';

const { listWorkBlobs, readWork } = require('./_lib');
const { query } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  try {
    // Prefer Postgres if configured
    try {
      const { rows } = await query(`select * from public.works where status = 'approved' order by submitted_at desc`);
      res.status(200).json(rows.map(r => ({
        id: Number(r.id),
        title: r.title,
        description: r.description,
        imageUrl: r.image_url,
        status: r.status,
        submittedAt: r.submitted_at,
        addedBy: r.added_by,
        imageSource: r.image_source,
        views: r.views ?? 0
      })));
      return;
    } catch (_) {}
    const blobs = await listWorkBlobs();
    const items = await Promise.all(blobs.map(b => readWork(b.pathname.replace(/^.*\//, '').replace(/\.json$/, ''))));
    const works = (items.filter(Boolean))
      .filter(w => w.status === 'approved')
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.status(200).json(works);
  } catch (e) {
    if (e && (e.code === 'NO_BLOB_TOKEN' || String(e.message || '').includes('Access denied'))) {
      res.status(200).json([]);
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to read works' });
  }
};

