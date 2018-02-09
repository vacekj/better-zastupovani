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
				await page.waitForSelector(test("suplovaniTable") + "> tbody > tr");
				const datePicker = await page.$(test("datePicker"));

				const currentSuplovani = await page.$(test("suplovaniTable")).then((el) => el.getProperty("innerHTML"));
				const currentHash = sha256(await currentSuplovani.jsonValue());

				await nextDate();
				const newSuplovani = await page.$(test("suplovaniTable")).toString();
				const newHash = sha256(await currentSuplovani.jsonValue());
				expect(currentHash).to.not.equal(newHash);
			});
		});

		describe("Filter textbox", () => {
			it("should display filter textbox", async () => {
				await page.waitForSelector(test("filterTextbox"));
			});

			it("should display filtered data on filter change", async () => {
				while (await page.waitForSelector(test("suplovaniTable") + "> tbody > tr > td[colspan]")) {
					await nextDate();
				}

				const suplovaniTable = await page.$(test("suplovaniTable"));
				const currentSuplovani = await suplovaniTable.getProperty("innerHTML");

				const filterTextbox = await page.$(test("filterTextbox"));
				const currentHash = sha256(await currentSuplovani.jsonValue());

				const randomFilter = await page.evaluate(() => document.querySelectorAll('[data-test="suplovaniTable"] > tbody > tr > td:nth-child(2)')[0].innerHTML);
				await filterTextbox.type(randomFilter);

				const newSuplovani = await suplovaniTable.getProperty("innerHTML");
				const newHash = sha256(await newSuplovani.jsonValue());
				expect(currentHash).to.not.equal(newHash);
				// TODO: Check if all filtered rows contain the filtered phrase
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
	return page.evaluate(() => {
		(document.querySelector(test("datePicker") + " > option:nth-child(3)") as HTMLOptionElement).selected = true;
		const element = document.querySelector(test("datePicker"));
		const event = new Event("change", { bubbles: true });
		element.dispatchEvent(event);
	});
}
