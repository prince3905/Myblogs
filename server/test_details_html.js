const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.sarkariresult.com/2026/rpsc-apo-june26/';
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(res.data);
    
    console.log('Main page headings (h1):', $('h1').text().trim());
    
    // Let's print out all divs with classes or IDs that have a lot of text
    $('div').each((i, el) => {
      const cls = $(el).attr('class') || '';
      const id = $(el).attr('id') || '';
      const textLen = $(el).text().trim().length;
      if (textLen > 1000 && (cls || id) && i < 100) {
        console.log(`Div ${i}: ID="${id}", Class="${cls}", Text Length=${textLen}`);
      }
    });

    // Let's print out text of first table on page
    console.log('\nFirst Table Text:');
    console.log($('table').first().text().trim().substring(0, 500));

  } catch (err) {
    console.error(err);
  }
}

test();
