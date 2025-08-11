'use strict';

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'index.html');
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (e) {
    res.status(500).send('Index file not found');
  }
};

