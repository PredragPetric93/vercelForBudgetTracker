import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import Jimp from 'jimp';
import jsQR from 'jsqr';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const form = new IncomingForm({ keepExtensions: true, uploadDir: "/tmp" });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("[FORM ERROR]", err);
      return res.status(500).json({ error: "Failed to parse upload" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file?.filepath) {
      console.error("[NO FILE]", files);
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const buffer = await fs.readFile(file.filepath);
      const image = await Jimp.read(buffer);
      const { data, width, height } = image.bitmap;

      const code = jsQR(new Uint8ClampedArray(data), width, height);

      if (!code) {
        console.error("[QR NOT FOUND]");
        return res.status(400).json({ error: "QR code could not be decoded" });
      }

      console.log("[QR SUCCESS]", code.data);
      return res.status(200).json({ text: code.data });
    } catch (decodeErr) {
      console.error("[DECODE ERROR]", decodeErr);
      return res.status(500).json({ error: "Failed to process image" });
    }
  });
}
