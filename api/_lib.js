'use strict';

const { list, put, del } = require('@vercel/blob');

const WORKS_PREFIX = 'works/';

function requireBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    const err = new Error('Blob storage token missing');
    err.code = 'NO_BLOB_TOKEN';
    throw err;
  }
}

function getBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  // Fallback: Vercel may create suffixed env vars per store
  const key = Object.keys(process.env).find(k => k.startsWith('BLOB_READ_WRITE_TOKEN'));
  if (key) return process.env[key];
  return undefined;
}

function workPath(id) {
  return `${WORKS_PREFIX}${id}.json`;
}

async function listWorkBlobs() {
  requireBlobToken();
  const token = getBlobToken();
  const result = await list({ prefix: WORKS_PREFIX, token });
  return result.blobs || [];
}

async function readWork(id) {
  requireBlobToken();
  const token = getBlobToken();
  const targetPath = workPath(id);
  const { blobs } = await list({ prefix: targetPath, token });
  const blob = (blobs || []).find(b => b.pathname === targetPath);
  if (!blob || !blob.url) return null;
  const resp = await fetch(blob.url);
  if (!resp.ok) return null;
  return await resp.json();
}

async function writeWork(work) {
  requireBlobToken();
  const token = getBlobToken();
  const id = work.id;
  await put(workPath(id), JSON.stringify(work, null, 2), {
    access: 'public',
    token,
    contentType: 'application/json; charset=utf-8'
  });
  return true;
}

async function deleteWork(id) {
  requireBlobToken();
  const token = getBlobToken();
  await del(workPath(id), { token });
}

module.exports = {
  listWorkBlobs,
  readWork,
  writeWork,
  deleteWork,
  getBlobToken,
  WORKS_PREFIX,
};

