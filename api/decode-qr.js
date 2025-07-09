import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
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

      // Read image into buffer
      const buffer = fs.readFileSync(filePath);

      // 🔍 Convert buffer to base64 so you can view the actual image in a browser
      const base64 = buffer.toString('base64');
      const mime = uploadedFile.mimetype || 'image/jpeg'; // fallback
      const dataUrl = `data:${mime};base64,${base64}`;

      console.log('🖼️ Viewable Image Data URL:\n', dataUrl.slice(0, 300) + '...');

      // Now try to decode
      const image = await Jimp.read(buffer);
      const qr = new QrCode();

      qr.callback = function (err, value) {
        if (err || !value) {
          return res.status(400).json({
            error: 'Failed to decode QR code',
            preview: dataUrl.slice(0, 500) + '...'
          });
        }

        return res.status(200).json({
          data: value.result,
          preview: dataUrl.slice(0, 500) + '...'
        });
      };

      qr.decode(image.bitmap);
    } catch (error) {
      console.error('QR decode error:', error);
      return res.status(500).json({ error: 'Server error while decoding image' });
    }
  });
}
