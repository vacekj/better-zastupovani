const proxy = 'https://cors-anywhere.herokuapp.com/';
$(document).ready(() => {
	const suplURL = 'http://suplovani.gytool.cz/';

	$.get(proxy + suplURL).done((data) => {
		console.log(data);
	}).fail((error) => {
		console.log(error);
	});

	getClasses().then(result => {
		console.log(result);
	});

});

function getClasses() {
	const rozvrhUrl = 'http://rozvrh.gytool.cz/index_Trida_Menu.html';
	return new Promise((resolve, reject) => {
		$.get(proxy + rozvrhUrl).done((data) => {
			let options = $(data).find('option');
			let values = options.map((i, option) => {
				return $(option).text();
			});
			let classes = $.makeArray(values);
			resolve(classes);
		});
	});

}