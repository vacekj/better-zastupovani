import { expect } from "chai";
import { isWeekend, startOfTomorrow } from "date-fns";
import { sha256 } from "js-sha256";
import * as puppeteer from "puppeteer";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

function test(testID) {
	return `[data-test="${testID}"]`;
}
describe("E2E Tests", () => {
	before(async () => {
		try {
			browser = await puppeteer.launch(
				process.env.CI
					? { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
					: {
						headless: false,
						args: ["--no-sandbox", "--disable-setuid-sandbox"],
						executablePath: "D:/bin/chrome.exe"
					}
			);
			page = await browser.newPage();

			// Throttle network
			const client = await page.target().createCDPSession();
			await client.send("Network.enable");
			await client.send("Network.emulateNetworkConditions", {
				offline: false,
				latency: 1000, // Miliseconds
				downloadThroughput: 300 * 1024 / 8, // 300 kb/s
				uploadThroughput: 300 * 1024 / 8, // 300 kb/s
			});

			// Don't await this since we need the page in loading state for the loading test to pass
			page.goto("http://zastupovani.gytool.cz");
		} catch (error) {
			throw error;
		}
	});

	describe("Basic layout", () => {
		it("should display loading indicator until data is loaded", async () => {
			await page.waitForSelector(test("loadingIndicator"));
		});
		describe("Date buttons", () => {
			it("should display today button", async () => {
				await page.waitForSelector(test("button_today"));
			});

			it("should display tomorrow button", async () => {
				await page.waitForSelector(test("button_tomorrow"));
			});

			it("should disable today button during the weekend", async () => {
				if (isWeekend(new Date())) {
					const button = await page.waitForSelector(test("button_today"));
					const property = await button.getProperty("disabled");
					expect(await property.jsonValue()).to.equal(true);
				}
			});

			it("should disable tomorrow if tomorrow is the weekend", async () => {
				if (isWeekend(startOfTomorrow())) {
					const button = await page.waitForSelector(test("button_tomorrow"));
					const property = await button.getProperty("disabled");
					expect(await property.jsonValue()).to.equal(true);
				}
			});
		});

		describe("Date picker", () => {
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

	after(async () => {
		await page.close();
		await browser.close();
		process.exit();
	});
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
