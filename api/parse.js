import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // ✅ Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://budgettracker-cf2d6-aab34.web.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const amount = $('#totalAmountLabel').text().trim();
    const date = $('#sdcDateTimeLabel').text().trim();

    const shop = $('#shopFullNameLabel').text().trim();
    const invoice = $('#invoiceTypeId').text().trim();
    const transaction = $('#transactionTypeId').text().trim();
    const comment = `${shop}, ${invoice} ${transaction}`;

    return res.status(200).json({
      amount,
      date,
      type: 'Scanned',
      comment
    });
  } catch (err) {
    console.error('Parse error:', err);
    return res.status(500).json({ error: 'Failed to parse receipt' });
  }
}
