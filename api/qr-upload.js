import formidable from 'formidable';
import fs from 'fs/promises';
import Jimp from 'jimp';
import jsQR from 'jsqr';

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
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await fs.readFile(uploadedFile[0].filepath);
      const image = await Jimp.read(buffer);
      const { data, width, height } = image.bitmap;

      const code = jsQR(new Uint8ClampedArray(data), width, height);
      if (!code) {
        return res.status(400).json({ error: 'QR code not found' });
      }

      return res.status(200).json({ text: code.data });
    } catch (e) {
      console.error("QR decode error:", e);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
