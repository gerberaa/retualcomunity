'use strict';

const basicAuth = require('basic-auth');
const { query } = require('../../_db');

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
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!auth(req, res)) return unauthorized(res);

  const { id } = req.query;
  let { status } = req.body || {};
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).send('Invalid status.');
    return;
  }

  const { rows } = await query(`update public.works set status=$1 where id=$2 returning *`, [status, id]);
  if (!rows.length) return res.status(404).send('Work not found.');
  const r = rows[0];
  res.status(200).json({ id: Number(r.id), title: r.title, description: r.description, imageUrl: r.image_url, status: r.status, submittedAt: r.submitted_at, addedBy: r.added_by, imageSource: r.image_source, views: r.views ?? 0 });
};

