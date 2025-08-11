'use strict';

const { Blob } = require('buffer');
const Busboy = require('busboy');
const { put } = require('@vercel/blob');
const { writeWork } = require('./_lib');
const { uploadImage } = require('./_storage');
const { migrate, query } = require('./_db');
const basicAuth = require('basic-auth');

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

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    let fileInfo = null;

    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        fileInfo = { filename, mimeType, buffer: Buffer.concat(chunks) };
      });
    });

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('finish', () => resolve({ fields, fileInfo }));
    busboy.on('error', reject);
    req.pipe(busboy);
  });
}

module.exports = async (req, res) => {
  if (!auth(req, res)) return unauthorized(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, fileInfo } = await parseMultipart(req);

    let imageUrl = fields['image-url'];
    if (fields['image-type'] === 'file') {
      if (!fileInfo) {
        res.status(400).json({ error: 'File not uploaded.' });
        return;
      }
      // Prefer Supabase Storage if configured, fallback to Blob
      try {
        imageUrl = await uploadImage(fileInfo.buffer, fileInfo.filename, fileInfo.mimeType);
      } catch (_) {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
          res.status(500).json({ error: 'Storage is not configured. Add Supabase or set BLOB_READ_WRITE_TOKEN.' });
          return;
        }
        const { put } = require('@vercel/blob');
        const blobName = `${Date.now()}-${fileInfo.filename}`;
        const { url } = await put(blobName, new Blob([fileInfo.buffer]), {
          contentType: fileInfo.mimeType,
          access: 'public',
          token
        });
        imageUrl = url;
      }
    }

    const id = Date.now();
    const work = {
      id,
      title: fields.title || 'Untitled',
      description: fields.description || 'No description',
      imageUrl,
      status: 'approved',
      submittedAt: new Date().toISOString(),
      addedBy: 'admin',
      imageSource: fields['image-type'] || 'url',
      views: 0
    };
    // Save metadata to Postgres if available
    try {
      await migrate();
      await query(
        `insert into public.works (id, title, description, image_url, status, submitted_at, added_by, image_source, views)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do update set
           title=excluded.title, description=excluded.description, image_url=excluded.image_url, status=excluded.status, submitted_at=excluded.submitted_at, added_by=excluded.added_by, image_source=excluded.image_source`,
        [work.id, work.title, work.description, work.imageUrl, work.status, work.submittedAt, work.addedBy, work.imageSource, work.views]
      );
    } catch (_) {
      await writeWork(work);
    }
    res.status(200).json({ message: 'Content added successfully!', work });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

