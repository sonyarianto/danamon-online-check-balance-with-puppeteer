const puppeteer = require('puppeteer');
require('dotenv').config();

if (
  !process.env.DANAMON_USER &&
  !process.env.DANAMON_PASSWORD
) {
  return console.log("Please edit the .env file with your Danamon Online credential!!!");
}

(async () => {
	// set some options (set headless to false so we can see 
	// this automated browsing experience)
	let launchOptions = { headless: false };
	
	// let's go to the Danamon Online internet banking website
	const browser = await puppeteer.launch(launchOptions);
	const page = await browser.newPage();
	await page.setViewport({width: 1366, height: 768});
	await page.goto('https://www.danamonline.com');

	// do the login, this is happen inside an iframe
	var frame = page.frames()[1];
	await frame.waitForSelector('#txtAccessCode');
	await frame.type('#txtAccessCode', process.env.DANAMON_USER);
	await frame.waitFor(1000);
	await frame.type('#txtPin', process.env.DANAMON_PASSWORD);
	await frame.waitFor(1000);
	await frame.waitForSelector('#cmdLogin');
	await frame.click('#cmdLogin');
	await frame.waitFor(3000);

	// get account name, inside an iframe on the right side
	frame = page.frames()[1];
	const accountName = await frame.evaluate(() => document.querySelectorAll('label[id="_ctl0_lblUsername"]')[0].textContent.trim() );

	// doing click on the left side menu, this is inside an iframe
	await frame.evaluate(() => document.querySelectorAll('a[headerindex="0h"]')[0].click());
	await frame.waitFor(1000);

	// doing click (again) on the left side menu, this will trigger 
	// summary balance info page on right iframe, 
	// this is inside an iframe
	await frame.evaluate(() => document.querySelectorAll('div[contentindex="0c"]')[0].querySelectorAll('a')[0].click());
	await frame.waitFor(5000);

	// get balance info on the balance page, this is inside an iframe on the right side
	frame = page.frames()[1];
	const accountNumber = await frame.evaluate(() => document.querySelectorAll('.custom1 tr')[1].querySelectorAll('td')[0].innerHTML.substring(document.querySelectorAll('.custom1 tr')[1].querySelectorAll('td')[0].innerHTML.indexOf('<br>') + 4));
	const currency = await frame.evaluate(() => document.querySelectorAll('.custom1 tr')[1].querySelectorAll('td')[1].textContent);
	const actualBalance = await frame.evaluate(() => document.querySelectorAll('.custom1 tr')[1].querySelectorAll('td')[2].textContent);
	const availableBalance = await frame.evaluate(() => document.querySelectorAll('.custom1 tr')[1].querySelectorAll('td')[3].textContent);	

	const balanceInfo = { 'account_no': accountNumber,
                          'account_name': accountName,
                          'currency': currency,
                          'actual_balance': actualBalance,
                          'available_balance': availableBalance }

	// display Danamon Online balance (plus account number, account type and currency type)
  	console.log(balanceInfo);

	await browser.close();
})();