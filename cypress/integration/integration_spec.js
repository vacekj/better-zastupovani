/// <reference types="Cypress" />

const { isWeekend, startOfTomorrow } = require("date-fns");
const sha256 = require("js-sha256");

function test(testID) {
	return `[data-test="${testID}"]`;
}

describe("Integration Tests", () => {
	it("loads successfully", () => {
		cy.visit(process.env.DEV_SERVER_HOST || "192.168.1.200");
	});

	describe("Date buttons", () => {
		it("should display today button", () => {
			cy.get(test("button_today")).should("exist");
		});
	});
});