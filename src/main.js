// Webpack imports
require('./index.html');
require('./style.css');

let $ = require('jquery');
let supl = require('./supl');

$(document).ready(() => {
	supl.getClasses().then(result => {
		console.log(result);
	});

	supl.getDates().then(result => {
		console.log(result);
		supl.getSuplovani(result[0].url).then((suplres) => {
			console.log(supl.parseSuplovani(suplres));
		});
	});

});