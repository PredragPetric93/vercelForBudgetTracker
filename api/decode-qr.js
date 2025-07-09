import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = formidable({ keepExtensions: true, multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(400).json({ error: 'Failed to parse form' });
    }

    if (!files || !files.file) {
      console.error('❌ No file found in upload:', files);
      return res.status(400).json({ error: 'No file received' });
    }

    const uploaded = files.file;
    const filePath = uploaded.filepath || uploaded.path;

    if (!filePath) {
      console.error('❌ File path is missing:', uploaded);
      return res.status(400).json({ error: 'Filepath missing' });
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const image = await Jimp.read(buffer);
      const base64 = await image.getBase64Async(Jimp.MIME_JPEG);

      console.log('✅ Image loaded. Dimensions:', image.bitmap.width, image.bitmap.height);
      return res.status(200).json({ previewBase64: base64 });
    } catch (error) {
      console.error('❌ Error reading image with Jimp:', error);
      return res.status(500).json({ error: 'Failed to read image' });
    }
  });
}
