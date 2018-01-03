// script to expand collapsed table headers

let $ = require('cash-dom');
let headers = [];

$(() => {
	$('th').each((th, index) => {
		let originalText = th.innerText;
		let newText = originalText.slice(0, 4);

		headers.push({
			originalText,
			newText
		});

		th.innerHTML = newText;
	});
});

let eventHandler = (th) => {
	th.target.innerHTML = headers.find((el) => {
		return el.newText == th.target.innerText;
	}).originalText;
};

$('th').one('touch', eventHandler).one('click', eventHandler).one('mouseover', eventHandler);
