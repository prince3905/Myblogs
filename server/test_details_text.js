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
    const content = $('.entry-content');
    
    // We want the details text. Let's clean up multiple newlines/spaces
    // to keep it readable but compact.
    // Instead of replacing all whitespace with a single space, we can preserve single newlines
    // so table rows are distinct, but strip out consecutive empty lines.
    let text = content.text()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
      
    console.log('--- Extracted Details Text (Length:', text.length, ') ---');
    console.log(text.substring(0, 2000)); // Print first 2000 chars

  } catch (err) {
    console.error(err);
  }
}

test();
