import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

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

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file received' });
    }

    const buffer = fs.readFileSync(uploadedFile.filepath);

    // ✅ Log image as base64 so you can inspect it
    const base64Image = buffer.toString('base64');
    console.log("🖼️ Base64 image:\n", base64Image);

    const image = await Jimp.read(buffer);
    const qr = new QrCode();

    qr.callback = (err, value) => {
      if (err || !value) {
        console.error("❌ QR decode failed", err);
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
