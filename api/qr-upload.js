// api/qr-upload.js

import { IncomingForm } from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

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
  if (req.method !== "POST") return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const form = new IncomingForm({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("FORM PARSE FAIL:", err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      console.log("FILES:", files);

      const fileKey = Object.keys(files)[0];
      const file = files[fileKey];

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const image = await Jimp.read(file.filepath);
        const qr = new QrCode();

        qr.callback = function (qrErr, value) {
          if (qrErr || !value) {
            console.error("QR DECODE FAIL:", qrErr);
            return res.status(400).json({ error: 'QR code could not be decoded' });
          }

          return res.status(200).json({ text: value.result });
        };

        qr.decode(image.bitmap);
      } catch (decodeErr) {
        console.error("DECODE FAIL:", decodeErr);
        return res.status(500).json({ error: 'Failed to process image' });
      }
    });
  } catch (fatalErr) {
    console.error("TOP-LEVEL ERROR:", fatalErr);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
