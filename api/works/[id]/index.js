'use strict';

const basicAuth = require('basic-auth');
const { readWork, deleteWork } = require('../../_lib');

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
  if (req.method !== 'DELETE') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!auth(req, res)) return unauthorized(res);

  const { id } = req.query;
  const work = await readWork(id);
  if (!work) return res.status(404).send('Work not found.');
  await deleteWork(id);
  res.status(200).json({ message: 'Work deleted successfully!' });
};

