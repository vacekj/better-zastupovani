import { objectContainsOneOf, teachersWithInitialsMap } from "./matchingLogic";

import { expect } from "chai";

describe("FilterHandler", () => {
	describe("Filter matching logic", () => {
		it("should be valid", () => {
			const acronymExpandings = teachersWithInitialsMap.map((o) => {
				return {
					filter: o.acronym,
					string: o.full,
					result: true
				};
			});
			const assertions = [
				...acronymExpandings,
				{
					filter: "II.B",
					string: "III.B",
					result: false
				},
				{
					filter: "IV.B8",
					string: "V.B8",
					result: false
				},
				{
					filter: "zat",
					string: "Zatloukal",
					result: false
				},
				{
					filter: "kre",
					string: "Krejčířová",
					result: false
				},
				{
					filter: "II.A6",
					string: "II.A6, II.B6",
					result: true
				},
				{
					filter: "II.A6",
					string: "II.A6,   ",
					result: false
				}
			];

			assertions.map((assertion) => {
				expect(objectContainsOneOf(
					{ string: assertion.string },
					[assertion.filter]),
					`expected ${assertion.filter} to ${assertion.result ? "MATCH" : "NOT MATCH"} string ${assertion.string}`
				).to.equal(assertion.result);
			});
		});
	});
});
