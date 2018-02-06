const object = {};
const hasOwnProperty = object.hasOwnProperty;
const stringFromCharCode = String.fromCharCode;

function error(codePoint, mode) {
	if (mode === "replacement") {
		return "\uFFFD";
	}
	if (codePoint != null && mode === "html") {
		return `&#${codePoint};`;
	}
	// else, `mode == 'fatal'`.
	throw Error();
}

export function decode(input, options?) {
	let mode;
	if (options && options.mode) {
		mode = options.mode.toLowerCase();
	}
	// “An error mode […] is either `replacement` (default) or `fatal` for a
	// decoder.”
	if (mode !== "replacement" && mode !== "fatal") {
		mode = "replacement";
	}
	const length = input.length;
	let index = -1;
	let byteValue;
	let pointer;
	let result = "";
	while (++index < length) {
		byteValue = input.charCodeAt(index);
		// “If `byte` is in the range `0x00` to `0x7F`, return a code point whose
		// value is `byte`.”
		if (byteValue >= 0x00 && byteValue <= 0x7F) {
			result += stringFromCharCode(byteValue);
			continue;
		}
		// “Let `code point` be the index code point for `byte − 0x80` in index
		// `single-byte`.”
		pointer = byteValue - 0x80;
	}

	return result;
}
