import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const form = formidable({ multiples: false, keepExtensions: true });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

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
