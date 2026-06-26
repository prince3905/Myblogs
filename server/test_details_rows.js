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
    
    $('table').each((tIdx, el) => {
      console.log(`Processing Table ${tIdx}...`);
      let stopProcessing = false;

      $(el).find('tr').each((rIdx, trEl) => {
        if (stopProcessing) return;

        const rowText = $(trEl).text().toLowerCase();
        if (rowText.includes('some useful important links') || rowText.includes('useful important links')) {
          console.log(`  Row ${rIdx} matches "Useful Important Links". Stopping Table ${tIdx} parsing.`);
          stopProcessing = true;
          return;
        }

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
