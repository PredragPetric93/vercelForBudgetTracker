// Proper ESM imports
import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

export const config = {
  api: {
    bodyParser: false
  }
};

// CORS headers
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

  // Use modern async API
  const form = formidable({
    multiples: false,
    keepExtensions: true
  });

  try {
    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file;

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file received' });
    }

    const buffer = fs.readFileSync(uploadedFile.filepath);
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
}
