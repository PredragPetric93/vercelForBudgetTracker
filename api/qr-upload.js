import formidable from 'formidable';
import fs from 'fs/promises';
import Jimp from 'jimp';
import jsQR from 'jsqr';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[FORM ERROR]', err);
      return res.status(500).json({ error: 'Form parsing failed' });
    }

    const uploaded = files.file;
    if (!uploaded) {
      console.error('[NO VALID FILE FOUND]', files);
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await fs.readFile(uploaded.filepath);
      const image = await Jimp.read(buffer);

      // Enhance image for better decoding
      image
        .greyscale()
        .contrast(1)
        .brightness(0.1)
        .resize(600, Jimp.AUTO);

      const { data, width, height } = image.bitmap;
      const code = jsQR(new Uint8ClampedArray(data), width, height);

      if (!code) {
        console.error('[QR NOT FOUND]');
        return res.status(400).json({ error: 'QR code could not be decoded' });
      }

      console.log('[QR DECODE SUCCESS]', code.data);
      return res.status(200).json({ text: code.data });

    } catch (decodeErr) {
      console.error('[DECODE FAIL]', decodeErr);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
