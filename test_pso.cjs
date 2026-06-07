const cheerio = require('cheerio');

async function test() {
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
  const r = await fetch('https://psopk.com/en/fuels/fuel-prices', { headers });
  const html = await r.text();
  const $ = cheerio.load(html);
  const bodyText = $('body').text().replace(/\s+/g, ' ');
  console.log("Body excerpt:", bodyText.substring(0, 500));
  
  const petrolMatch = bodyText.match(/PREMIER EURO 5\s*Rs\.?\s*([\d.]+)/i);
  console.log("Petrol match old:", petrolMatch);
  
  // Look for alternatives
  const petrolMatchNew = bodyText.match(/(?:Altron Premium|Premium|Petrol|Super).*?Rs\.?\s*([\d.]+)/i);
  console.log("Petrol match new:", petrolMatchNew);
  
  // Find all Rs. XXX
  const rsMatches = bodyText.match(/Rs\.?\s*[\d.]+/ig);
  console.log("All Rs matches:", rsMatches?.slice(0, 10));
}

test();
