'use strict';

const Busboy = require('busboy');
const { uploadImage } = require('./_storage');
const { migrate, query } = require('./_db');

// Helper to parse multipart/form-data in Vercel serverless
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, fileInfo } = await parseMultipart(req);
    if (!fileInfo) {
      res.status(400).json({ error: 'File not uploaded.' });
      return;
    }

    // Upload file to Supabase Storage only
    const url = await uploadImage(fileInfo.buffer, fileInfo.filename, fileInfo.mimeType);

    const id = Date.now();
    const work = {
      id,
      title: fields.title,
      description: fields.description,
      imageUrl: url,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      views: 0
    };
    // Persist metadata in Postgres only
    await migrate();
    await query(
      `insert into public.works (id, title, description, image_url, status, submitted_at, views)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do update set
         title=excluded.title, description=excluded.description, image_url=excluded.image_url, status=excluded.status, submitted_at=excluded.submitted_at`,
      [work.id, work.title, work.description, work.imageUrl, work.status, work.submittedAt, work.views]
    );

    res.status(200).json({ message: 'Work submitted successfully!', work });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

