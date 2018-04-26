export function objectContainsOneOf<T>(object: T, rawFilters: string[]) {
	const filters = rawFilters;

	// Expand teacher acronym to full name silently
	filters.map((filter) => {
		teachersWithInitialsMap.map((teacher) => {
			if (teacher.acronym === filter) {
				filters.push(teacher.full);
			}
		});
	});

	return filters.some((filter) => {
		return objectContainsString(object, filter);
	});
}

export function objectContainsString<T>(object: T, filter: string) {
	const matchWholeWord = shouldMatchWholeWord(filter) ? "$" : "";

	const regex = new RegExp("^\\b" + escapeRegExp(filter) + matchWholeWord, "i");

	return Object.values(object).some((value: string) => {
		return regex.test(value);
	});
}

function shouldMatchWholeWord(filter: string) {
	// If filter is a class, match only whole word to prevent II.A from matching II.A6
	const classRegex = new RegExp(".{1,4}\.[ABC][6|8]?");
	if (classRegex.test(filter)) {
		return true;
	}

	// If filter is an expanded teacher name, match only whole word to prevent Krejčíř from matching Krejčířová
	if (teachersWithInitialsMap
		.some((teacher) => filter
			.toLowerCase()
			.includes(teacher.full.toLowerCase())
		)) {
		return true;
	}

	// If filter is a teacher without initial, match only whole word to prevent Kre from matching Krejčířová
	const teachersWithoutInitials = ["kre", "zat"];
	if (teachersWithoutInitials.some((teacher) => filter.toLowerCase() === teacher)) {
		return true;
	}

	return false;
}

export const teachersWithInitialsMap: Array<{ acronym: string, full: string }> = [
	{
		acronym: "Navm", full: "Navrátil"
	},
	{
		acronym: "Navl", full: "Navrátilová"
	},
	{
		acronym: "Havk", full: "Havelková"
	},
	{
		acronym: "Krel", full: "Krejčířová"
	},
	{
		acronym: "Kre", full: "Krejčíř"
	},
	{
		acronym: "Chrj", full: "Chromá"
	},
	{
		acronym: "Stám", full: "Stánec"
	},
	{
		acronym: "ZatI", full: "Zatloukalová"
	},
	{
		acronym: "Zat", full: "Zatloukalová"
	},
	{
		acronym: "Havk", full: "Havranová"
	},
	{
		acronym: "Pry", full: "Przybylová"
	}
];

function escapeRegExp(str: string) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
