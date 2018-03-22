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
					filter: "V.",
					string: "V.B8",
					result: true
				},
				{
					filter: "zat",
					string: "Zatloukal",
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
			];

			assertions.map((assertion) => {
				expect(objectContainsOneOf({ string: assertion.string }, [assertion.filter])).to.equal(assertion.result);
			});
		});
	});
});
