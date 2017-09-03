// Webpack imports
require('./index.html');
require('./style.css');
require('./bootstrap.min.css');
require('bootstrap-loader');

let $ = require('jquery');
let supl = require('./supl');

$(document).ready(() => {
	supl.getClasses().then(result => {
		var option = '';
		for (var i = 0; i < result.length; i++) {
			option += '<option value="' + result[i].url + '">' + result[i].date + '</option>';
		}
		$('#selector_class').append(option);
	});

	supl.getDates().then(result => {
		console.log(result);
		supl.getSuplovani(result[0].url).then((suplres) => {
			console.log(supl.parseSuplovani(suplres));
		});
	});

});