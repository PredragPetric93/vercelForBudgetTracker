import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS: Always set these headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS preflight response
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      console.error('❌ Form parsing error or missing file:', err, files);
      return res.status(400).json({ error: 'No file received' });
    }

    try {
      const filePath = files.file.filepath;
      const fileStats = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      console.log('📦 File received:', {
        path: filePath,
        size: fileStats.size,
        name: files.file.originalFilename,
        mime: files.file.mimetype,
      });

      const image = await Jimp.read(buffer);
      const base64 = await image.getBase64Async(Jimp.MIME_JPEG);
      console.log('📷 Image loaded successfully, sending preview back');

      return res.status(200).json({
        previewBase64: base64,
        width: image.bitmap.width,
        height: image.bitmap.height,
      });
    } catch (error) {
      console.error('❌ Error reading image with Jimp:', error);
      return res.status(500).json({ error: 'Failed to read image' });
    }
  });
}
