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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(400).json({ error: 'Form parse error' });
    }

    const uploadedFile = files.file;
    if (!uploadedFile || !uploadedFile.filepath) {
      console.error('❌ File path is missing:', uploadedFile);
      return res.status(400).json({ error: 'Filepath missing' });
    }

    const filepath = uploadedFile.filepath;
    console.log(`✅ File received at: ${filepath}`);

    try {
      const image = await Jimp.read(filepath);
      console.log(`✅ Image loaded. Dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

      const qr = new QrCode();

      qr.callback = (err, value) => {
        if (err) {
          console.error('❌ QR decode failed:', err);
          return res.status(400).json({ error: 'Failed to decode QR code' });
        }

        console.log('✅ QR code result:', value);
        return res.status(200).json({ data: value?.result || null });
      };

      qr.decode(image.bitmap);
    } catch (error) {
      console.error('❌ Error reading image with Jimp:', error);
      return res.status(500).json({ error: 'Failed to read image' });
    }
  });
}
