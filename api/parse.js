import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    const amount = $("#totalAmountLabel").text().trim();
    const date = $("#sdcDateTimeLabel").text().trim();

    const storeName = $("label:contains('Име продајног места')").next().text().trim();
    const storeType = $("label:contains('Врста')").next().text().trim();

    res.status(200).json({ amount, date, storeName, storeType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse receipt." });
  }
}
