import Jimp from 'jimp';
import QrCode from 'qrcode-reader';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buffers = [];

    const contentType = req.headers['content-type'];
    if (!contentType.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const boundary = contentType.split('boundary=')[1];
    const body = await readStream(req);

    const fileMatch = body.match(/Content-Type: image\/jpeg[\s\S]*?\r\n\r\n([\s\S]*?)\r\n--/);
    if (!fileMatch) {
      return res.status(400).json({ error: 'File not found in request' });
    }

    const base64Data = Buffer.from(fileMatch[1], 'binary');
    const image = await Jimp.read(base64Data);
    const qr = new QrCode();

    qr.callback = (err, value) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (err || !value) {
        return res.status(400).json({ error: 'Failed to decode QR code' });
      }
      return res.status(200).json({ data: value.result });
    };

    qr.decode(image.bitmap);
  } catch (err) {
    console.error('QR decode error:', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Server error while decoding image' });
  }
}

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('binary')));
    stream.on('error', reject);
  });
}
