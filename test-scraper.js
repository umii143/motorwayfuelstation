import * as cheerio from 'cheerio';

async function test(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Attempt PSO specific table parsing
    let psoPetrol = null;
    let psoDiesel = null;
    $('tr').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('pmg') || text.includes('altron premium')) {
        const match = text.match(/(\d{3}\.\d{2})/);
        if (match) psoPetrol = match[1];
      }
      if (text.includes('hsd') || text.includes('action+')) {
        const match = text.match(/(\d{3}\.\d{2})/);
        if (match) psoDiesel = match[1];
      }
    });

    console.log(url, 'PSO Extraction -> Petrol:', psoPetrol, 'Diesel:', psoDiesel);
    console.log(url, 'Status:', res.status, 'HTML length:', html.length);
  } catch(e) {
    console.error(url, 'Failed:', e.message);
  }
}

test('https://psopk.com/en/fuels/pol-prices');
