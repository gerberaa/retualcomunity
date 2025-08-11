'use strict';

const basicAuth = require('basic-auth');
const basicAuth = require('basic-auth');
const { query } = require('./_db');

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

  if (req.method === 'GET') {
    // GET list is public; admin actions are protected below
    try {
      const { rows } = await query(`select * from public.works order by submitted_at desc`);
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
      res.status(500).send('Failed to list works');
    }
    return;
  }

  if (req.method === 'POST') {
    if (!auth(req, res)) return unauthorized(res);
    const { id } = req.query;
    let { status } = req.body || {};
    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      res.status(400).send('Invalid request');
      return;
    }
    try {
      const { rows } = await query(`update public.works set status=$1 where id=$2 returning *`, [status, id]);
      if (!rows.length) return res.status(404).send('Work not found.');
      const r = rows[0];
      res.status(200).json({ id: Number(r.id), title: r.title, description: r.description, imageUrl: r.image_url, status: r.status, submittedAt: r.submitted_at, addedBy: r.added_by, imageSource: r.image_source, views: r.views ?? 0 });
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to update work');
    }
    return;
  }

  if (req.method === 'DELETE') {
    if (!auth(req, res)) return unauthorized(res);
    const { id } = req.query;
    try {
      const { rowCount } = await query(`delete from public.works where id=$1`, [id]);
      if (!rowCount) return res.status(404).send('Work not found.');
      res.status(200).json({ message: 'Work deleted successfully!' });
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to delete work');
    }
    return;
  }

  res.status(405).send('Method not allowed');
};

