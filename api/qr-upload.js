import { IncomingForm } from 'formidable';
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

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const form = new IncomingForm({ keepExtensions: true, uploadDir: '/tmp' });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("[FORM PARSE ERROR]", err);
      return res.status(500).json({ error: "Failed to parse form" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file?.filepath) {
      console.error("[NO VALID FILE FOUND]", files);
      return res.status(400).json({ error: "No file uploaded or invalid format" });
    }

    try {
      const image = await Jimp.read(file.filepath);
      const qr = new QrCode();

      qr.callback = (qrErr, value) => {
        if (qrErr || !value) {
          console.error("[QR DECODE FAIL]", qrErr || "No result");
          return res.status(400).json({ error: "QR code could not be decoded" });
        }

        console.log("[QR SUCCESS]", value.result);
        return res.status(200).json({ text: value.result });
      };

      qr.decode(image.bitmap);
    } catch (err) {
      console.error("[JIMP PROCESS ERROR]", err);
      return res.status(500).json({ error: "Failed to process image" });
    }
  });
}
