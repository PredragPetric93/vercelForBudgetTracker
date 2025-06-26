// api/qr-upload.js
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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const image = await Jimp.read(file.filepath);
      const qr = new QrCode();

      qr.callback = function (err, value) {
        if (err || !value) {
          console.error("QR decode error:", err);
          return res.status(400).json({ error: 'QR code could not be decoded' });
        }
        return res.status(200).json({ text: value.result });
      };

      qr.decode(image.bitmap);
    } catch (decodeErr) {
      console.error("QR processing error:", decodeErr);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
