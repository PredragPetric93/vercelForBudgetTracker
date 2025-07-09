const formidable = require('formidable');
const fs = require('fs');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      return res.status(400).json({ error: 'Image file missing or error parsing form' });
    }

    try {
      const imagePath = files.file.filepath;
      const buffer = fs.readFileSync(imagePath);

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
      return res.status(500).json({ error: 'Server error while decoding image' });
    }
  });
}