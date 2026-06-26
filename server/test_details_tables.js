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
    
    let combinedText = '';
    
    $('table').each((i, el) => {
      const text = $(el).text();
      // Skip the links table
      if (text.toLowerCase().includes('useful important links') || text.toLowerCase().includes('some useful important')) {
        console.log(`Skipping Table ${i} (links table)`);
        return;
      }
      
      console.log(`Processing Table ${i}...`);
      
      // Extract rows and format cells
      $(el).find('tr').each((rIdx, trEl) => {
        const rowCells = [];
        $(trEl).find('td, th').each((cIdx, tdEl) => {
          rowCells.push($(tdEl).text().trim().replace(/\s+/g, ' '));
        });
        if (rowCells.length > 0) {
          combinedText += rowCells.join(' | ') + '\n';
        }
      });
      combinedText += '\n';
    });

    console.log('\n--- Final Combined Vacancy Details (Length:', combinedText.trim().length, ') ---');
    console.log(combinedText.trim());

  } catch (err) {
    console.error(err);
  }
}

test();
