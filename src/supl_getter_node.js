const request_ = require('request');
const iconv = require('iconv-lite');
const suplParser = require('./supl_parser');

const URL_SUPL = 'http://suplovani.gytool.cz/';
const URL_ROZVRH = 'http://rozvrh.gytool.cz/index_Trida_Menu.html';
const URL_DATES = URL_SUPL + '!index_menu.html';

function request(url, cb) {
	request_({
		url,
		encoding: null
	}, (err, res, body) => {
		let decodedBody = iconv.decode(body, 'win1250');
		cb(err, res, decodedBody);
	});
}

function getClasses() {
	return new Promise((resolve, reject) => {
		request(URL_ROZVRH, (err, res, body) => {
			if (err) {
				reject(err);
			}
			resolve(body);
		});
	});
}

function getDatesPage() {
	return new Promise((resolve, reject) => {
		request(URL_DATES, (err, res, body) => {
			if (err) {
				reject(err);
			}
			resolve(body);
		});
	});
}

function getSuplovani(date) {
	return new Promise((resolve, reject) => {
		request(URL_SUPL + date.url, (err, res, body, $) => {
			if (err) {
				reject(err);
			}
			resolve(body);
		});
	});
}

function getSuplovaniForAllDates() {
	return new Promise((resolve, reject) => {
		getDatesPage().then(datesPage => {
			const dates = suplParser.parseDatesPage(datesPage);

			let promises = dates.map((date) => {
				return getSuplovani(date);
			});
			let allPromises = Promise.all(promises);
			allPromises.then((res) => {
				let result = res.map((supl) => {
					return Object.assign({}, supl.date, suplParser.parseSuplovani(supl));
				});
				resolve(result);
			});
		});
	});
}

module.exports = { getClasses, getSuplovani, getDatesPage, getSuplovaniForAllDates };