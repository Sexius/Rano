// Test: simulate what scrapeItemVending does by fetching GNJOY directly
const https = require('https');

const url = 'https://ro.gnjoy.com/itemdeal/itemDealList.asp?svrID=9&itemFullName=' + encodeURIComponent('요르') + '&itemOrder=&inclusion=&curpage=1';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://ro.gnjoy.com/',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find the dealList table
    const tableStart = data.indexOf('class="listTypeOfDefault dealList"');
    if (tableStart === -1) {
      console.log('NO TABLE FOUND!');
      console.log('Response length:', data.length);
      console.log('First 500 chars:', data.substring(0, 500));
      return;
    }

    // Find onclick="CallItemDealView patterns
    const onclickPattern = /CallItemDealView\(([^)]+)\)/g;
    let match;
    let count = 0;
    const items = [];
    while ((match = onclickPattern.exec(data)) !== null) {
      count++;
      const params = match[1].split(',').map(p => p.trim().replace(/'/g, ''));
      items.push({
        svrId: params[0],
        mapId: params[1],
        ssi: params[2]
      });
    }
    console.log('Total CallItemDealView found:', count);
    if (items.length > 0) {
      console.log('First item:', JSON.stringify(items[0]));
      console.log('Last item:', JSON.stringify(items[items.length - 1]));
    }

    // Count <tr> rows in table
    const tableSection = data.substring(tableStart);
    const trMatches = tableSection.match(/<tr/g);
    console.log('Total <tr> in table section:', trMatches ? trMatches.length : 0);

    // Check total item count
    const totalMatch = data.match(/searchResult[^>]*>.*?(\d+)/s);
    if (totalMatch) {
      console.log('Total items reported:', totalMatch[1]);
    }
    
    // Check svrID=9 means baphomet
    console.log('\n--- Checking if svrID mapping is correct ---');
    const serverMatch = data.match(/서버\s*:\s*([^<]+)/);
    if (serverMatch) {
      console.log('Server from page:', serverMatch[1]);
    }
  });
}).on('error', (e) => {
  console.error('Request failed:', e.message);
});
