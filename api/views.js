'use strict';

const { readWork, writeWork } = require('./_lib');
const { query } = require('./_db');

module.exports = async (req, res) => {

  if (req.method === 'POST') {
    const { id } = req.query;
    try {
      const { rows } = await query(`update public.works set views = coalesce(views,0)+1 where id=$1 returning views`, [id]);
      if (!rows.length) return res.status(404).json({ error: 'Work not found.' });
      res.status(200).json({ message: 'View recorded successfully!', views: rows[0].views, workId: id });
    } catch (_) {
      const work = await readWork(id);
      if (!work) return res.status(404).json({ error: 'Work not found.' });
      work.views = (work.views || 0) + 1;
      await writeWork(work);
      res.status(200).json({ message: 'View recorded successfully!', views: work.views, workId: id });
    }
    return;
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    try {
      const { rows } = await query(`select views from public.works where id=$1`, [id]);
      if (rows.length) return res.status(200).json({ views: rows[0].views || 0, workId: id });
    } catch (_) {}
    const work = await readWork(id);
    if (!work) return res.status(404).json({ error: 'Work not found.' });
    res.status(200).json({ views: work.views || 0, workId: id });
    return;
  }

  res.status(405).send('Method not allowed');
};

