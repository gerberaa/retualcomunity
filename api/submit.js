'use strict';

const { Blob } = require('buffer');
const Busboy = require('busboy');
const { put } = require('@vercel/blob');
const { writeWork, getBlobToken } = require('./_lib');

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

    // Upload file to Vercel Blob
    const blobName = `${Date.now()}-${fileInfo.filename}`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'Storage is not configured. Please add Vercel Blob and set BLOB_READ_WRITE_TOKEN.' });
      return;
    }
    const { url } = await put(blobName, new Blob([fileInfo.buffer]), {
      contentType: fileInfo.mimeType,
      access: 'public',
      token
    });

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
    // Persist metadata as JSON blob
    await writeWork(work);

    res.status(200).json({ message: 'Work submitted successfully!', work });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

