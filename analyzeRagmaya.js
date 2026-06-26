const html = require('fs').readFileSync('ragmaya_live.html', 'utf8');

// Find all script src tags
const scriptRegex = /src="([^"]*\.js[^"]*)"/g;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}
console.log('=== JS Bundles ===');
scripts.forEach(s => console.log(s));

// Find Next.js data / API references
console.log('\n=== API/Data References ===');
const apiRegex = /["'](\/api\/[^"']+)["']/g;
while ((match = apiRegex.exec(html)) !== null) {
  console.log(match[1]);
}

// Find fetch/axios calls
console.log('\n=== Fetch patterns ===');
const fetchRegex = /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g;
while ((match = fetchRegex.exec(html)) !== null) {
  console.log(match[1]);
}

// Find WebSocket references
console.log('\n=== WebSocket references ===');
const wsRegex = /wss?:\/\/[^"'\s]+/g;
while ((match = wsRegex.exec(html)) !== null) {
  console.log(match[0]);
}

// Find database/tech references
console.log('\n=== Tech Stack Clues ===');
const techKeywords = ['supabase', 'firebase', 'mongodb', 'postgres', 'redis', 'prisma', 'drizzle', 'socket.io', 'puppeteer', 'playwright', 'selenium', 'graphql'];
techKeywords.forEach(kw => {
  if (html.toLowerCase().includes(kw)) {
    console.log('Found:', kw);
  }
});

// Find __NEXT_DATA__
const nextDataStart = html.indexOf('__NEXT_DATA__');
if (nextDataStart > -1) {
  const snippet = html.substring(nextDataStart, nextDataStart + 500);
  console.log('\n=== __NEXT_DATA__ snippet ===');
  console.log(snippet);
}

// Find any inline script with data
console.log('\n=== RSC/Preloaded Data ===');
const rscRegex = /self\.__next_f\.push\(\[1,"([^"]{0,200})"/g;
let count = 0;
while ((match = rscRegex.exec(html)) !== null && count < 20) {
  console.log(match[1]);
  count++;
}
