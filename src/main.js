// Webpack imports
require('./index.html');
require('./style.css');
require('./bootstrap.min.css');
require('bootstrap-loader');

let $ = require('jquery');
let supl = require('./supl');
let moment = require('moment');

$(document).ready(() => {
	render();


});

function render() {
	updateClasses();
	updateDate();
}

function updateDate() {
	supl.getDates().then(result => {
		// Set current value
		let today = moment().format('YYYY-MM-DD');
		$('#selector_date').val(today);

		// Set Max and Min value
		let sorted = result.map(res => res.date).sort(function (a, b) {
			return a - b;
		});
		let min = sorted[0];
		let max = sorted[sorted.length - 1];
		$('#selector_date').attr({
			"max": max.format('YYYY-MM-DD'),
			"min": min.format('YYYY-MM-DD')
		});
	});
}

function updateClasses() {
	supl.getClasses().then(result => {
		let html = ClassesToOptions(result);
		$('#selector_class').append(html);
	});
}

function ClassesToOptions(classes) {
	var option = '';
	for (var i = 0; i < classes.length; i++) {
		option += '<option value="' + classes[i] + '">' + classes[i] + '</option>';
	}
	return option;
}