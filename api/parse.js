import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  const receiptUrl = req.query.url;
  if (!receiptUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  try {
    const response = await fetch(receiptUrl);
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const amountText = doc.querySelector('#totalAmountLabel')?.textContent.trim();
    const dateText = doc.querySelector('#sdcDateTimeLabel')?.textContent.trim();

    res.status(200).json({
      amount: amountText || null,
      date: dateText || null
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to parse receipt", detail: err.message });
  }
}