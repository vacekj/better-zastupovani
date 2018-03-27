// eslint-disable-next-line spaced-comment
/// <reference types="Cypress" />

import { isWeekend, isFriday } from 'date-fns';

const sha256 = require('js-sha256');

describe('Integration Tests', () => {
	it('loads successfully', () => {
		cy.visit(Cypress.env("TEST_SERVER") || '192.168.1.200:8080');
	});

	describe('Tutorial', () => {
		it('displays tutorial on first visit', () => {
			cy.get('#driver-popover-item').should('be.visible');
		});

		it('goes to next and previous steps', () => {
			cy.get('.driver-next-btn').click();
			cy.wait(500);
			cy.get('.driver-prev-btn').click();
			cy.wait(500);
		});

		it('cancels the tutorial on overlay click', () => {
			cy.get('#driver-page-overlay').click();
		});

		it('cancels the tutorial on cancel button click', () => {
			cy.
				clearCookies()
				.reload()
				.get('#driver-popover-item > div.driver-popover-footer > button')
				.click();
		});
	});


	describe('Date buttons', () => {
		beforeEach(() => {
			cy.get(test('button_today')).as('todayButton');
			cy.get(test('button_tomorrow')).as('tomorrowButton');
			cy.get(test('suplovaniTable')).as('suplovaniTable');
		});

		it('displays buttons', () => {
			cy.get('@todayButton').should('exist');
			cy.get('@tomorrowButton').should('exist');
		});

		it('disables buttons during the weekend and on friday', () => {
			const today = new Date();
			if (isWeekend(today)) {
				cy.get('@todayButton').should('have.attr', 'disabled');
			} else if (isFriday(today)) {
				cy.get('@tomorrowButton').should('have.attr', 'disabled');
			}
		});

		it("changes data on day buttons click", () => {
			lastDate();
			cy.get("@tomorrowButton").then((button) => {
				if (!button[0].getAttribute("disabled")) {
					const oldHTML = button[0].innerHTML;
					cy.get("@tomorrowButton").click().then(() => {
						checkHTMLChanged(oldHTML);
					});
				}
			});

			lastDate();
			cy.get("@tomorrowButton").then((button) => {
				if (!button[0].getAttribute("disabled")) {
					const oldHTML = button[0].innerHTML;
					cy.get("@tomorrowButton").click().then(() => {
						checkHTMLChanged(oldHTML);
					});
				}
			});
		});
	});

	// TODO: test hiding empty columns on mobile
	// TODO: Add tests for the best date picking logic when time mocking is working
	describe('Date Picker', () => {
		beforeEach(() => {
			cy.get(test('datePicker')).as('datePicker');
			cy.get(test('suplovaniTable')).as('suplovaniTable');
			cy.get(test('filterTextbox')).as('filterTextbox');
		});

		it('displays datePicker', () => {
			cy.get('@datePicker').should('exist');
		});

		it('loads some date and corresponding data on startup', () => {
			cy.get(test('filterTextbox')).clear();
			waitForLoad();
		});

		it('changes data on datePicker date change', () => {
			cy.get('@suplovaniTable').then((el) => {
				return el[0].innerHTML;
			}).then((oldHTML) => {
				nextDate();
				checkHTMLChanged(oldHTML);
			});
		});
	});

	describe('Filter textbox', () => {
		beforeEach(() => {
			cy.get(test('suplovaniTable')).as('suplovaniTable');
			cy.get(test('filterTextbox')).as('filterTextbox');
		});

		it('changes data on filter text change', () => {
			cy.get('@suplovaniTable').then((el) => {
				return el[0].innerHTML;
			}).then((innerHTML) => {
				return sha256(innerHTML);
			}).then(async (hash) => {
				cy.get('[data-test=suplovaniTable] > tbody > :nth-child(1) > :nth-child(2)').then((tds) => {
					const text = tds[0].innerText;
					cy.get('@filterTextbox').type(text);
					cy.get('@suplovaniTable').then((el) => el[0].innerHTML).then((innerHTML) => {
						expect(hash).to.not.equal(sha256(innerHTML));
					});
				});
			});
		});
	});

	describe('Tertiary tests', () => {
		it('goes back to top on clicking back to top button', () => {
			cy
				.get("#pruvodce")
				.scrollIntoView()
				.get("#back-to-top")
				.click()
				.wait(300)
				.window()
				.then((window) => {
					expect(window.scrollY).to.equal(0);
				});
		});
	});
});

function checkHTMLChanged(oldHTML) {
	cy.get('@suplovaniTable').then((el) => {
		return el[0].innerHTML;
	}).then((currentHTML) => {
		expect(sha256(currentHTML)).to.not.equal(sha256(oldHTML));
	});
}

function lastDate() {
	cy.get(test('datePicker')).then((result) => {
		const optionsLength = result[0].options.length;
		cy
			.get(test('datePicker') + ' > option')
			.filter(`:nth-child(${optionsLength - 1})`)
			.invoke('attr', 'selected', true);
		triggerDateChange();
	});
}

function nextDate() {
	cy.get(test('datePicker')).then((result) => {
		const selectedIndex = result[0].selectedIndex;
		cy
			.get(test('datePicker') + ' > option')
			.filter(`:nth-child(${selectedIndex + 3})`)
			.invoke('attr', 'selected', true);
		triggerDateChange();
	});
}

function waitForLoad() {
	// TODO: check if data matches class, room etc regexes
	cy.get('[data-test=suplovaniTable] > tbody > :nth-child(1) > :nth-child(2)');
}

function triggerDateChange() {
	cy
		.get(test('datePicker'))
		.trigger('change');
	waitForLoad();
}

function test(testID) {
	return `[data-test="${testID}"]`;
}
