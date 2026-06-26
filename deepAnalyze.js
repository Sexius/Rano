const fs = require('fs');
const files = ['ragmaya_9466.js', 'ragmaya_9486.js', 'ragmaya_live_page.js'];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log(`\n=== ${f} (${content.length} bytes) ===`);
  
  // Find API endpoints
  const apiPattern = /["'`](\/api\/[^"'`\s]+)["'`]/g;
  let m;
  while ((m = apiPattern.exec(content)) !== null) {
    console.log('API:', m[1]);
  }
  
  // Find fetch calls
  const fetchPattern = /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g;
  while ((m = fetchPattern.exec(content)) !== null) {
    console.log('fetch:', m[1]);
  }
  
  // Find doSearch, loadVending, searchVending
  const keywords = ['doSearch', 'searchVending', 'loadVending', 'gnjoy', 'puppeteer', 'playwright', 'supabase', 'firebase', 'mongodb', 'postgres', 'redis', 'prisma', 'socket', 'websocket', 'SSE', 'EventSource'];
  keywords.forEach(kw => {
    const idx = content.toLowerCase().indexOf(kw.toLowerCase());
    if (idx > -1) {
      console.log(`Found "${kw}" at ${idx}:`, content.substring(Math.max(0,idx-30), idx+50));
    }
  });
});

// Also check the HTML for inline scripts with search logic
const html = fs.readFileSync('ragmaya_live.html', 'utf8');
console.log('\n=== HTML inline script search ===');
const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g;
let m;
let scriptIdx = 0;
while ((m = scriptPattern.exec(html)) !== null) {
  const body = m[1].trim();
  if (body.length > 50 && body.length < 50000 && !body.startsWith('self.__next')) {
    console.log(`\nScript #${scriptIdx} (${body.length} chars):`);
    console.log(body.substring(0, 300));
  }
  scriptIdx++;
}

// Check for RSC payload that might contain search endpoint
console.log('\n=== RSC Data with API refs ===');
const rscPattern = /self\.__next_f\.push\(\[1,"([^"]+)"/g;
while ((m = rscPattern.exec(html)) !== null) {
  const decoded = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  if (decoded.includes('/api/') || decoded.includes('search') || decoded.includes('live-engine')) {
    console.log(decoded.substring(0, 200));
  }
}
