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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true, multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err || !files || !files.file) {
        return res.status(400).json({ error: 'File upload error or missing file' });
      }

      // Handle array or single file
      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!uploadedFile || !uploadedFile.filepath) {
        return res.status(400).json({ error: 'Invalid file data received' });
      }

      const buffer = await fs.readFile(uploadedFile.filepath);
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
