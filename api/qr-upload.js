// api/qr-upload.js

import { IncomingForm } from 'formidable';
import { read } from 'jimp';
import QrCode from 'qrcode-reader';
import { Buffer } from 'buffer';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('FORM PARSE FAIL:', err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const file = files.file;
    if (!file) {
      console.error('NO FILE FOUND:', files);
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await file.toBuffer(); // works with formidable v2
      const image = await read(buffer);
      const qr = new QrCode();

      qr.callback = function (qrErr, value) {
        if (qrErr || !value) {
          console.error('QR DECODE FAIL:', qrErr);
          return res.status(400).json({ error: 'QR code could not be decoded' });
        }

        console.log('QR SUCCESS:', value.result);
        return res.status(200).json({ text: value.result });
      };

      qr.decode(image.bitmap);
    } catch (decodeErr) {
      console.error('DECODE FAIL:', decodeErr);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  });
}
