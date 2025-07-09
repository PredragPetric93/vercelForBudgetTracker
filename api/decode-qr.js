import { IncomingForm } from 'formidable';
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

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err || !files.file) {
        return res.status(400).json({ error: 'Image file missing or parsing failed' });
      }

      // ✅ Vercel-compatible: use toBuffer() directly
      const file = files.file;
      const fileBuffer = await file.toBuffer();

      const image = await Jimp.read(fileBuffer);
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
