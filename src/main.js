// Webpack imports
require('./index.html');
require('./style.css');
require('./bootstrap.min.css');
require('bootstrap-loader');

let $ = require('jquery');
let supl = require('./supl');
let moment = require('moment');
let md5 = require('blueimp-md5');

var state = {
	suplovani: [],
	classes: [],
	currentDate: moment().format('YYYY-MM-DD'),
	currentClass: ''
};

var localStorage = window.localStorage;

// MAIN ENTRY POINT
$(document).ready(() => {
	registerEventHandlers();
	if (isCachePresent()) {
		updateStateFromCache();
		render();
		validateCache().then((valid) => {
			if (valid) {
				// Everything ok
			} else {
				updateState().then(() => {
					updateCacheFromState();
					render();
				});
			}
		});
	}
});

function isCachePresent() {
	return localStorage.getItem('state') !== undefined;
}

function updateStateFromCache() {
	let cachedState = localStorage.getItem('state');
	state.suplovani = JSON.parse(cachedState);
}

function updateCacheFromState() {
	let toCache = state.suplovani;
	localStorage.setItem('state', JSON.stringify(toCache));
}

function validateCache() {
	return new Promise((resolve, reject) => {
		let currentCache = localStorage.getItem('state');
		let currentCacheHash = md5(currentCache);

		supl.getSuplovaniForAllDates().then((suplovani) => {
			let liveDataHash = md5(JSON.stringify(suplovani));
			if (liveDataHash !== currentCacheHash) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

function updateState() {
	return new Promise((resolve, reject) => {
		Promise.all([
			supl.getClasses(),
			supl.getSuplovaniForAllDates()
		]).then((data) => {
			state.classes = data[0];
			state.suplovani = data[1];
			resolve();
		});
	});
}

function registerEventHandlers() {
	$('#selector_class').on('change', function () {
		let newValue = this.value;
		state.currentClass = newValue;
		render();
	});

	$('#selector_date').on('change', function () {
		let newValue = this.value;
		state.currentDate = newValue;
		render();
	});
}

function render() {
	updateClasses(state);
	updateDates(state);
	updateSuplovani();
}

function updateSuplovani() {
	$('#table_suplovani > tbody').empty();
	let currentSuplovani = state.suplovani.find((suplovani) => {
		return moment(suplovani.date.format('YYYY-MM-DD')).isSame(state.currentDate);
	});
	let filter = {};
	filter.class = state.currentClass;
	let contentToAppend = '';
	const noSupl = `<tr>
	<td colspan="8">Žádné suplování</td>
	</tr>
	`;
	if (!currentSuplovani) {
		contentToAppend = noSupl;
	} else {
		let filteredSuplovani = currentSuplovani.suplovani.filter((elem) => {
			return filter.class == elem.trida;
		});
		if (!filteredSuplovani.length) {
			contentToAppend = noSupl;
		} else {
			contentToAppend = SuplToTrs(filteredSuplovani);
		}
	}

	$('#table_suplovani').append(contentToAppend);
}

function SuplToTrs(suplovani) {
	return suplovani.map((element) => {
		return `<tr>
			<td>${element.hodina}</td>
			<td>${element.trida}</td>
			<td>${element.predmet}</td>
			<td>${element.ucebna}</td>
			<td>${element.nahucebna}</td>
			<td>${element.vyuc}</td>
			<td>${element.zastup}</td>
			<td>${element.pozn}</td>
		</tr>
		`;
	});
}

function updateDates(context) {
	// Extract dates from context
	let dates = context.suplovani.map((suplovani) => {
		return suplovani.date;
	});

	// Set current value
	$('#selector_date').val(state.currentDate);

	// Set Max and Min value
	let sorted = dates.sort(function (a, b) {
		return a - b;
	});
	let min = sorted[0];
	let max = sorted[sorted.length - 1];
	$('#selector_date').attr({
		"max": max.format('YYYY-MM-DD'),
		"min": min.format('YYYY-MM-DD')
	});
}

function updateClasses() {
	let html = ClassesToOptions(state.classes);
	$('#selector_class').append(html);
}

function ClassesToOptions(classes) {
	var option = '';
	for (var i = 0; i < classes.length; i++) {
		option += '<option value="' + classes[i] + '">' + classes[i] + '</option>';
	}
	return option;
}