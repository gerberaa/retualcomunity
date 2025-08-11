'use strict';

const { query } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read works' });
  }
};

