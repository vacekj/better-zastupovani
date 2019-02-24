const object = {};
const hasOwnProperty = object.hasOwnProperty;
const stringFromCharCode = String.fromCharCode;

const INDEX_BY_POINTER = { 0: "\u20AC", 1: "\x81", 2: "\u201A", 3: "\x83", 4: "\u201E", 5: "\u2026", 6: "\u2020", 7: "\u2021", 8: "\x88", 9: "\u2030", 10: "\u0160", 11: "\u2039", 12: "\u015A", 13: "\u0164", 14: "\u017D", 15: "\u0179", 16: "\x90", 17: "\u2018", 18: "\u2019", 19: "\u201C", 20: "\u201D", 21: "\u2022", 22: "\u2013", 23: "\u2014", 24: "\x98", 25: "\u2122", 26: "\u0161", 27: "\u203A", 28: "\u015B", 29: "\u0165", 30: "\u017E", 31: "\u017A", 32: "\xA0", 33: "\u02C7", 34: "\u02D8", 35: "\u0141", 36: "\xA4", 37: "\u0104", 38: "\xA6", 39: "\xA7", 40: "\xA8", 41: "\xA9", 42: "\u015E", 43: "\xAB", 44: "\xAC", 45: "\xAD", 46: "\xAE", 47: "\u017B", 48: "\xB0", 49: "\xB1", 50: "\u02DB", 51: "\u0142", 52: "\xB4", 53: "\xB5", 54: "\xB6", 55: "\xB7", 56: "\xB8", 57: "\u0105", 58: "\u015F", 59: "\xBB", 60: "\u013D", 61: "\u02DD", 62: "\u013E", 63: "\u017C", 64: "\u0154", 65: "\xC1", 66: "\xC2", 67: "\u0102", 68: "\xC4", 69: "\u0139", 70: "\u0106", 71: "\xC7", 72: "\u010C", 73: "\xC9", 74: "\u0118", 75: "\xCB", 76: "\u011A", 77: "\xCD", 78: "\xCE", 79: "\u010E", 80: "\u0110", 81: "\u0143", 82: "\u0147", 83: "\xD3", 84: "\xD4", 85: "\u0150", 86: "\xD6", 87: "\xD7", 88: "\u0158", 89: "\u016E", 90: "\xDA", 91: "\u0170", 92: "\xDC", 93: "\xDD", 94: "\u0162", 95: "\xDF", 96: "\u0155", 97: "\xE1", 98: "\xE2", 99: "\u0103", 100: "\xE4", 101: "\u013A", 102: "\u0107", 103: "\xE7", 104: "\u010D", 105: "\xE9", 106: "\u0119", 107: "\xEB", 108: "\u011B", 109: "\xED", 110: "\xEE", 111: "\u010F", 112: "\u0111", 113: "\u0144", 114: "\u0148", 115: "\xF3", 116: "\xF4", 117: "\u0151", 118: "\xF6", 119: "\xF7", 120: "\u0159", 121: "\u016F", 122: "\xFA", 123: "\u0171", 124: "\xFC", 125: "\xFD", 126: "\u0163", 127: "\u02D9" };

// Link: https://encoding.spec.whatwg.org/#error-mode
const error = (codePoint, mode) => {
	if (mode === "replacement") {
		return "\uFFFD";
	}
	if (codePoint != null && mode === "html") {
		return "&#" + codePoint + ";";
	}
	// Else, `mode == 'fatal'`.
	throw Error();
};

// Link: https://encoding.spec.whatwg.org/#single-byte-decoder
export function decode(input: ArrayBuffer, options?) {
	const inputView = new Uint8Array(input);
	let mode;
	if (options && options.mode) {
		mode = options.mode.toLowerCase();
	}
	// "An error mode […] is either `replacement` (default) or `fatal` for a decoder."
	if (mode !== "replacement" && mode !== "fatal") {
		mode = "replacement";
	}
	const length = inputView.length;
	let index = -1;
	let byteValue;
	let pointer;
	let result = "";
	while (++index < length) {
		byteValue = inputView[index];
		// "If `byte` is in the range `0x00` to `0x7F`, return a code point whose value is `byte`."
		if (byteValue >= 0x00 && byteValue <= 0x7F) {
			result += stringFromCharCode(byteValue);
			continue;
		}
		// “Let `code point` be the index code point for `byte − 0x80` in index
		// `single-byte`.”
		pointer = byteValue - 0x80;
		if (hasOwnProperty.call(INDEX_BY_POINTER, pointer)) {
			// “Return a code point whose value is `code point`.”
			result += INDEX_BY_POINTER[pointer];
		} else {
			// “If `code point` is `null`, return `error`.”
			result += error(null, mode);
		}
	}
	return result;
}
