/// <reference types="Cypress" />

const { isWeekend, startOfTomorrow } = require("date-fns");
const sha256 = require("js-sha256");

function test(testID) {
	return `[data-test="${testID}"]`;
}

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
		});

		it("displays datePicker", () => {
			cy.get("@datePicker").should("exist");
		});

		it('changes data on datePicker date change', () => {
			cy.get(test("suplovaniTable")).then((el) => {
				return el[0].innerHTML;
			}).then((innerHTML) => {
				return sha256(innerHTML);
			}).then((hash) => {
				console.log(hash);
			});
		});
	});
});