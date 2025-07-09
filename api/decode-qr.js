import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

export const config = {
  api: {
    bodyParser: false
  }
};

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      return res.status(400).json({ error: 'Image file missing or form error' });
    }

    try {
      const uploadedFile = files.file;
      const filePath = uploadedFile.filepath || uploadedFile.path;
      const buffer = fs.readFileSync(filePath);

      const image = await Jimp.read(buffer);
      const qr = new QrCode();

      qr.callback = (err, value) => {
        if (err || !value) {
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
