import formidable from 'formidable';
import fs from 'fs/promises';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const uploadedFile = files.file;
    if (!uploadedFile || !uploadedFile[0] || !uploadedFile[0].filepath) {
      return res.status(400).json({ error: 'No file uploaded or path missing' });
    }

    try {
      const imageBuffer = await fs.readFile(uploadedFile[0].filepath);
      const image = await Jimp.read(imageBuffer);
      const qr = new QrCode();

      qr.callback = (qrErr, value) => {
        if (qrErr || !value) {
          console.error("QR decode error:", qrErr);
          return res.status(400).json({ error: 'QR code could not be decoded' });
        }
        return res.status(200).json({ text: value.result });
      };

      qr.decode(image.bitmap);
    } catch (decodeErr) {
      console.error("JIMP decode error:", decodeErr);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
