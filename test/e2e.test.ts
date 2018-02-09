import { expect } from "chai";
import { sha256 } from "js-sha256";
import * as puppeteer from "puppeteer";

import * as connect from "connect";
import * as serveStatic from "serve-static";

const server = connect().use(serveStatic("dist"));

let browser: puppeteer.Browser;
let page: puppeteer.Page;

function test(testID) {
	return `[data-test="${testID}"]`;
}

before((done) => {
	server.listen(8000, async () => {
		browser = await puppeteer.launch(
			process.env.CI
				? { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
				: {
					headless: false,
					args: ["--no-sandbox", "--disable-setuid-sandbox"]
				}
		);
		page = await browser.newPage();

		// Throttle network
		const client = await page.target().createCDPSession();
		await client.send("Network.enable");
		await client.send("Network.emulateNetworkConditions", {
			offline: false,
			latency: 1000, // Miliseconds
			downloadThroughput: 300 * 1024 / 8, // 780 kb/s
			uploadThroughput: 300 * 1024 / 8, // 330 kb/s
		});

		page.goto("localhost:8000");
		done();
	});
});

describe("E2E Tests", () => {
	describe("Basic layout", () => {
		describe("Date picker", () => {
			it("should display loading indicator until data is loaded", async () => {
				await page.waitForSelector(test("loadingIndicator"));
			});

			it("should display date picker", async () => {
				await page.waitForSelector(test("datePicker"));
			});

			it("should change data on date change", async () => {
				await page.waitFor(2000);
				const currentSuplovani = await innerHTML(test("suplovaniTable"));
				const currentHash = sha256(currentSuplovani);

				await nextDate();
				await page.waitFor(300);
				const newSuplovani = await innerHTML(test("suplovaniTable"));
				const newHash = sha256(newSuplovani);
				expect(currentHash).to.not.equal(newHash);
			});
		});

		describe("Filter textbox", () => {
			it("should display filter textbox", async () => {
				await page.waitForSelector(test("filterTextbox"));
			});

			it("should display filtered data on filter change", async () => {
				await page.waitFor(2000);

				const currentSuplovani = await innerHTML(test("suplovaniTable"));
				const currentHash = sha256(currentSuplovani);

				const filterText = await innerHTML("#table_suplovani > tbody > tr:nth-child(1) > td:nth-child(2)");
				await setFilter(filterText);
				await page.waitFor(300);
				const newSuplovani = await innerHTML(test("suplovaniTable"));
				const newHash = sha256(newSuplovani);
				expect(currentHash).to.not.equal(newHash);

				await page.evaluate((selector, filter) => {
					const tds = document.querySelectorAll(selector);
					return Array.prototype.every.call(tds, (td) => {
						td.innerHTML.includes(filter);
					});
				}, "#table_suplovani tbody td", filterText);
			});
		});
	});

});

after(async (done) => {
	await page.close();
	await browser.close();
	process.exit();
});

async function nextDate() {
	const select = await page.waitForSelector(test("datePicker"));
	await select.press("ArrowDown");
	await select.press("Enter");
}

async function setFilter(filterText: string) {
	const filter = await page.waitForSelector(test("filterTextbox"));
	await filter.type(filterText, { delay: 100 });
}

async function innerHTML(selector: string): Promise<string> {
	return page.evaluate((el) => {
		return document.querySelector(el).innerHTML;
	}, selector);
}
