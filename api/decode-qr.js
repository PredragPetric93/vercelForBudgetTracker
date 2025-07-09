import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err || !files.file) {
        return res.status(400).json({ error: 'Image file missing or parsing failed' });
      }

      const file = files.file;
      const buffer = await fs.readFile(file.filepath); // ✅ Use fs.promises to read image

      const image = await Jimp.read(buffer);
      const qr = new QrCode();

      qr.callback = (error, value) => {
        if (error || !value) {
          return res.status(400).json({ error: 'Failed to decode QR code' });
        }
        return res.status(200).json({ data: value.result });
      };

      qr.decode(image.bitmap);
    } catch (error) {
      console.error('QR decode error:', error);
      return res.status(500).json({ error: 'Server error while decoding image' });
    }
  });
}
