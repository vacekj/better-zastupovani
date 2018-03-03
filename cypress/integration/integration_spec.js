/// <reference types="Cypress" />

const { isWeekend, startOfTomorrow } = require("date-fns");
const sha256 = require("js-sha256");

describe("Integration Tests", () => {
	it("loads successfully", () => {
		cy.visit(process.env.DEV_SERVER_HOST || "192.168.1.200:8080");
	});

	describe("Date buttons", () => {
		beforeEach(() => {
			cy.get(test("button_today")).as("todayButton");
			cy.get(test("button_tomorrow")).as("tomorrowButton");

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
	});

	describe("Date Picker", () => {
		beforeEach(() => {
			cy.get(test("datePicker")).as("datePicker");
			cy.get(test("suplovaniTable")).as("suplovaniTable");
			cy.get(test("filterTextbox")).as("filterTextbox");
		});

		it("displays datePicker", () => {
			cy.get("@datePicker").should("exist");
		});

		it('changes data on datePicker date change', () => {
			cy.get("@suplovaniTable").then((el) => {
				return el[0].innerHTML;
			}).then((innerHTML) => {
				return sha256(innerHTML);
			}).then(async (hash) => {
				const s = await nextDate();
				cy
					.get("@suplovaniTable")
					.then(el => el[0].innerHTML)
					.then((innerHTML) => {
						expect(hash).to.not.equal(sha256(innerHTML));
					});
			});
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

async function nextDate() {
	await cy.get(test("datePicker")).then(async (result) => {
		const selectedIndex = result[0].selectedIndex;
		cy.get(test("datePicker") + " > option").filter(`:nth-child(${selectedIndex + 3})`).invoke("attr", "selected", true)
			.get(test("datePicker")).trigger("change");
		await cy.get(test("loadingIndicator")).should("not.exist");
	});
}

function test(testID) {
	return `[data-test="${testID}"]`;
}
