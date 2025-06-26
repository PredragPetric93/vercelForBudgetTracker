const cheerio = require('cheerio');
const axios = require('axios');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const amount = $('#totalAmountLabel')?.text()?.trim();
    const date = $('#sdcDateTimeLabel')?.text()?.trim();

    const shopName = $('#shopFullNameLabel')?.text()?.trim();
    const invoiceType = $('#invoiceTypeId')?.text()?.trim();
    const transactionType = $('#transactionTypeId')?.text()?.trim();

    const comment = [shopName, invoiceType, transactionType].filter(Boolean).join(', ');

    return res.json({
      amount,
      date,
      comment,
      type: "Scanned"
    });
  } catch (err) {
    console.error('Failed to parse receipt:', err);
    return res.status(500).json({ error: 'Failed to parse receipt' });
  }
};
