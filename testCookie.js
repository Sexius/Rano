async function run() {
    const r1 = await fetch('https://ro.gnjoy.com/itemdeal/itemDealList.asp?itemFullName=' + encodeURIComponent('천공의 무기') + '&searchItemType=item&svrID=1&curpage=1', {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}});
    const cookies = r1.headers.get('set-cookie');
    console.log('Cookies:', cookies);
    const text1 = await r1.text();
    const ssi = text1.match(/ssi=([^&'\"]+)/);
    if(!ssi) return console.log('No ssi found');
    console.log('ssi:', ssi[1]);
    const r2 = await fetch('https://ro.gnjoy.com/itemdeal/itemDealView.asp?svrID=1&mapID=2023&ssi=' + ssi[1] + '&curpage=1', {headers: {'User-Agent': 'Mozilla/5.0', 'Cookie': cookies, 'Referer': 'https://ro.gnjoy.com/itemdeal/itemDealList.asp'}});
    const t2 = await r2.text();
    console.log('Length2:', t2.length);
    if(t2.length>0) console.log(t2.substring(0, 500));
}
run();
