const fs = require('fs');
fetch('https://ro.gnjoy.com/itemdeal/itemDealList.asp?svrID=9&itemFullName=' + encodeURIComponent('요르') + '&curpage=1')
  .then(r => r.arrayBuffer())
  .then(buf => {
    fs.writeFileSync('raw.bin', Buffer.from(buf));
    console.log("Raw size:", buf.byteLength);
  });
