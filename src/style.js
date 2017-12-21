// script to expand collapsed table headers

let $ = require('jquery');
let headers = [];
$(document).ready(() => {
	$('th').each((index, th) => {
		let originalText = th.innerText;
		let newText = originalText.slice(0, 4);

		headers.push({
			originalText,
			newText
		});

		th.innerHTML = newText;
	});
});


$('th').on('touch click hover', (th) => {
	th.target.innerHTML = headers.find((el) => {
		return el.newText == th.target.innerText;
	}).originalText;
});