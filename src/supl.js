const proxy = 'https://cors-anywhere.herokuapp.com/';
const suplURL = 'http://suplovani.gytool.cz/';

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

module.exports = {
	getClasses
};