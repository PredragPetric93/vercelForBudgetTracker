import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract raw amount string
    let rawAmount = $('#totalAmountLabel').text().trim();
    // Convert "6.555,75" → "6555.75"
    rawAmount = rawAmount.replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(rawAmount);

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
