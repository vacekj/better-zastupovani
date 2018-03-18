/// <reference types="Cypress" />

const sha256 = require("js-sha256");

describe("Integration Tests", () => {
	it("loads successfully", () => {
		cy.visit(process.env.DEV_SERVER_HOST || "192.168.1.200:8080");
	});

	describe("Date buttons", () => {
		beforeEach(() => {
			cy.get(test("button_today")).as("todayButton");
			cy.get(test("button_tomorrow")).as("tomorrowButton");
			cy.get("[data-test=datePicker]").as("datePicker");
			cy.get("[data-test=datePicker] > option").as("option");
		});

		it("displays buttons", () => {
			cy.get("@todayButton").should("exist");
			cy.get("@tomorrowButton").should("exist");
		});

		// FIXME: maybe a bug with Cypress
		// it("disables buttons based on date", () => {
		// 	// Weekend
		// 	const weekend = new Date(2017, 3, 5).getTime();
		// 	cy.clock(3000);
		// 	cy.reload(true)
		// 		.get("@todayButton").should("have.attr", "disabled");

		// 	// Friday
		// 	cy.clock(new Date(2018, 3, 2).getTime());
		// 	cy.reload()
		// 		.get("@tomorrowButton").should("have.attr", "disabled");
		// });

		// // TODO: check that buttons change date on click to corresponding date.
		// it("changes date when buttons are clicked", () => {
		// 	// mock time to monday
		// 	const monday = new Date(2018, 2, 26).getTime();
		// 	cy.clock(monday, ["Date"]);
		// 	cy.reload(true);
		// 	waitForLoad();
		// 	triggerDateChange();
		// 	// test that clicking tomorrow changes the date to tomorrow
		// 	cy.get(test("button_tomorrow")).click();
		// 	cy.get("@datePicker").then((datePicker) => {
		// 		const index = datePicker[0].selectedIndex;
		// 		const selectedDate = datePicker.children()[index];
		// 		cy.wrap(selectedDate).should("have.text", "27. 2. 2018");
		// 	});

		// });
	});
	// TODO: test hiding empty columns on mobile
	// TODO: Add tests for the best date picking logic when time mocking is working
	describe("Date Picker", () => {
		beforeEach(() => {
			cy.get(test("datePicker")).as("datePicker");
			cy.get(test("suplovaniTable")).as("suplovaniTable");
			cy.get(test("filterTextbox")).as("filterTextbox");
		});

		it("displays datePicker", () => {
			cy.get("@datePicker").should("exist");
		});

		it('loads some date and corresponding data on startup', () => {
			waitForLoad();
		});

		it('changes data on datePicker date change', () => {
			cy.get("@suplovaniTable").then((el) => {
				return el[0].innerHTML;
			}).then((innerHTML) => {
				return sha256(innerHTML);
			}).then(async (hash) => {
				await nextDate();
				cy
					.get("@suplovaniTable")
					.then(el => el[0].innerHTML)
					.then((innerHTML) => {
						expect(hash).to.not.equal(sha256(innerHTML));
					});
			});
		});
	});

	describe('Filter textbox', () => {
		beforeEach(() => {
			cy.get(test("suplovaniTable")).as("suplovaniTable");
			cy.get(test("filterTextbox")).as("filterTextbox");
		});

		it('changes data on filter text change', () => {
			cy.get("@suplovaniTable").then((el) => {
				return el[0].innerHTML;
			}).then((innerHTML) => {
				return sha256(innerHTML);
			}).then(async (hash) => {
				cy.get("[data-test=suplovaniTable] > tbody > :nth-child(1) > :nth-child(2)").then((tds) => {
					const text = tds[0].innerText;
					cy.get("@filterTextbox").type(text);
					cy.get("@suplovaniTable").then(el => el[0].innerHTML).then((innerHTML) => {
						expect(hash).to.not.equal(sha256(innerHTML));
					});
				});
			});
		});
	});
});

function nextDate() {
	cy.get(test("datePicker")).then(async (result) => {
		const selectedIndex = result[0].selectedIndex;
		cy
			.get(test("datePicker") + " > option")
			.filter(`:nth-child(${selectedIndex + 3})`)
			.invoke("attr", "selected", true);
		await triggerDateChange();
	});
}

function waitForLoad() {
	cy.get("[data-test=suplovaniTable] > tbody > :nth-child(1) > :nth-child(2)");
}

function triggerDateChange() {
	cy
		.get(test("datePicker"))
		.trigger("change");
	waitForLoad();
}

function test(testID) {
	return `[data-test="${testID}"]`;
}
