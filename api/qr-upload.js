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
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const file = files.file?.[0];
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'No file uploaded or invalid file format' });
    }

    try {
      const buffer = await fs.readFile(file.filepath);
      const image = await Jimp.read(buffer);
      const qr = new QrCode();

      qr.callback = function (qrErr, value) {
        if (qrErr || !value) {
          console.error("QR decode failed:", qrErr);
          return res.status(400).json({ error: 'QR code could not be decoded' });
        }

        return res.status(200).json({ text: value.result });
      };

      qr.decode(image.bitmap);
    } catch (decodeErr) {
      console.error("Image processing error:", decodeErr);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
