// Webpack imports
require('./index.html');
require('./style.css');
let popper = require('popper.js');
window.popper = popper;
require('./bootstrap-reboot.min.css');
require('./bootstrap.min.css');
require('bootstrap-loader');


let $ = require('jquery');
let moment = require('moment');
let Cookies = require('js-cookie');

const API_URL = 'http://zastupovani.herokuapp.com/api';
const COOKIE_CLASS = 'trida';

// Create global state
window.state = {
	suplovani: [],
	classes: [],
	currentDate: moment().format('YYYY-MM-DD'),
	currentClass: ''
};

// MAIN ENTRY POINT
$(document).ready(() => {
	registerEventHandlers();

	// Remember class
	let classCookie = Cookies.get(COOKIE_CLASS);
	if (classCookie !== undefined && classCookie !== '') {
		let newState = Object.assign(getState(), {
			currentClass: classCookie
		});
		updateState(newState);
		renderClasses();
	}

	// Update state from server
	getStateFromServer().then((state) => {
		// overwrite state
		updateState(state);
		render();
	}).catch((err) => {
		console.log(err);
	});
});

function updateState(newState, overwrite) {
	if (overwrite) {
		window.state = newState;
	} else {
		window.state = Object.assign(getState(), newState);
	}
}

function getState() {
	return window.state;
}

function getStateFromServer() {
	return new Promise((resolve, reject) => {
		$.get(API_URL + '/data').then((res) => {
			// revive dates to moment objects
			let revivedSuplovani = res.suplovani.map((supl) => {
				return Object.assign(supl, {
					date: moment(supl.date)
				});
			});
			let revivedState = Object.assign(res, {
				suplovani: revivedSuplovani
			});
			resolve(revivedState);
		}, reject);
	});
}

function registerEventHandlers() {
	$('#selector_class').on('change', function () {
		let newValue = this.value;
		updateState({
			currentClass: newValue
		});
		Cookies.set(COOKIE_CLASS, newValue);
		render();
	});

	$('#selector_date').on('change', function () {
		let newValue = this.value;
		updateState({
			currentDate: newValue
		});
		render();
	});
}

function render() {
	renderClasses();
	renderDates();
	renderSuplovani();
}

function renderSuplovani() {
	// clear the table
	$('#table_suplovani > tbody').empty();

	let currentSuplovani = getState().suplovani.find((suplovani) => {
		return moment(suplovani.date.format('YYYY-MM-DD')).isSame(getState().currentDate);
	});

	let filter = {};
	filter.class = getState().currentClass;
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

function renderDates() {
	// Extract dates from context
	let dates = getState().suplovani.map((suplovani) => {
		return suplovani.date;
	});

	// Set current value
	$('#selector_date').val(getState().currentDate);

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

function renderClasses() {
	$('#selector_class').empty();
	let html = ClassesToOptions(getState().classes);
	$('#selector_class').append(html);
	if (getState().currentClass) {
		$('#selector_class').val(getState().currentClass);
	}
}

function ClassesToOptions(classes) {
	var option = '';
	for (var i = 0; i < classes.length; i++) {
		option += '<option value="' + classes[i] + '">' + classes[i] + '</option>';
	}
	return option;
}