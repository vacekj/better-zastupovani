const puppeteer = require('puppeteer');
const expect = require('chai').expect;

const connect = require('connect');
const serveStatic = require('serve-static');

var server = connect().use(serveStatic('dist'));

var browser;
var page;

function test(testID) {
	return `[data-test="${testID}"]`;
}

before((done) => {
	server.listen(8000, async () => {
		browser = await puppeteer.launch(
			process.env.CI
				? {}
				: {
					headless: false,
					slowMo: 100,
				}
		);
		page = await browser.newPage();
		await page.goto('localhost:8000');
		done();
	});
});

describe('Basic layout', () => {
	it('should display date picker', async () => {
		await page.waitForSelector(test('datePicker'));
	});
	it('should display filter textbox', async () => {
		await page.waitForSelector(test('filterTextbox'));
	});
});

after(async (done) => {
	await browser.close();
	process.exit();
});