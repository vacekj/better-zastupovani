// const puppeteer = require('puppeteer');
// const expect = require('chai').expect;
// const sha = require('sha1');

// const connect = require('connect');
// const serveStatic = require('serve-static');

// var server = connect().use(serveStatic('dist'));

// var browser;
// var page;

// function test(testID) {
// 	return `[data-test="${testID}"]`;
// }

// before((done) => {
// 	server.listen(8000, async () => {
// 		browser = await puppeteer.launch(
// 			process.env.CI
// 				? {}
// 				: {
// 					headless: false,
// 					slowMo: 100,
// 					args: ['--no-sandbox']
// 				}
// 		);
// 		page = await browser.newPage();
// 		await page.goto('localhost:8000');
// 		done();
// 	});
// });

// describe('Basic layout', () => {
// 	describe('Date picker', () => {
// 		it('should display date picker', async () => {
// 			await page.waitForSelector(test('datePicker'));
// 		});

// 		it('should display loading indicator until data is loaded', async () => {
// 			await page.waitForSelector(test('loadingIndicator'));
// 		});

// 		it('should disable date picker until data is loaded', async () => {
// 			await page.waitForSelector(test('datePicker') + '[disabled="true"]');
// 		});
// 		// TODO: finish this test when date selector is basic select
// 		// it('should change data on date change', async () => {
// 		// 	await page.waitForSelector(test('suplovaniTable') + '> tbody > tr');
// 		// 	let datePicker = await page.$(test('datePicker'));
// 		// 	let currentSuplovani = await page.$(test('suplovaniTable')).then(el => el.getProperty('innerHTML'));
// 		// 	let currentHash = sha(JSON.stringify(currentSuplovani));
// 		// 	await datePicker.focus();
// 		// 	await datePicker.type('ArrowUp');
// 		// 	let newSuplovani = await page.$(test('suplovaniTable')).toString();
// 		// 	let newHash = sha(JSON.stringify(newSuplovani));
// 		// 	expect(currentHash).to.not.equal(newHash);
// 		// });
// 	});

// 	// TODO: finish this when dateSelector is normal select

// 	// describe('Filter textbox', () => {
// 	// 	it('should display filter textbox', async () => {
// 	// 		await page.waitForSelector(test('filterTextbox'));
// 	// 	});

// 	// 	it('should display filtered data on filter change', async () => {
// 	// 		while (await page.waitForSelector(test('suplovaniTable') + '> tbody > tr > td[colspan]')) {
// 	// 			await nextDate();
// 	// 		}

// 	// 		let suplovaniTable = await page.$(test('suplovaniTable'));
// 	// 		let currentSuplovani = await suplovaniTable.getProperty('innerHTML');

// 	// 		let filterTextbox = await page.$(test('filterTextbox'));
// 	// 		let currentHash = sha(currentSuplovani);

// 	// 		let randomFilter = await page.evaluate(() => document.querySelectorAll('[data-test="suplovaniTable"] > tbody > tr > td:nth-child(2)')[0].innerText);
// 	// 		await filterTextbox.type(randomFilter);

// 	// 		let newSuplovani = await suplovaniTable.getProperty('innerHTML');
// 	// 		let newHash = sha(newSuplovani);
// 	// 		expect(currentHash).to.not.equal(newHash);
// 	// 		// TODO: Check if all filtered rows contain the filtered phrase
// 	// 	});
// 	// });

// 	// TODO: check if displayed data looks like classes, hours etc. (prevent the 'undefined' bug)
// });

// after(async (done) => {
// 	await browser.close();
// 	process.exit();
// });

// async function nextDate() {
// 	const datePicker = await page.waitForSelector(test('datePicker'));
// 	page.evaluate(() => {
// 		document.querySelector('#selector_date').stepUp();
// 	});
// }