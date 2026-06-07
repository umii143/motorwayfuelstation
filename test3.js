import * as cheerio from 'cheerio';
async function test(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ');
    const pMatch = text.match(/petrol.{0,40}?Rs\.?\s*(\d{3}(?:\.\d{1,2})?)/i) || text.match(/Rs\.?\s*(\d{3}(?:\.\d{1,2})?).{0,40}?petrol/i);
    const dMatch = text.match(/diesel.{0,40}?Rs\.?\s*(\d{3}(?:\.\d{1,2})?)/i) || text.match(/Rs\.?\s*(\d{3}(?:\.\d{1,2})?).{0,40}?diesel/i);
    console.log(url, '=> P:', pMatch?.[1], 'D:', dMatch?.[1]);
  } catch(e) {}
}
await test('https://pk.urdupoint.com/business/petrol-price-in-pakistan.html');
await test('https://urdu.geo.tv/latest/325251-');
