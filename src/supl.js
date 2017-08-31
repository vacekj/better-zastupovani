const $ = require('cheerio');
const parseTable = require('./cheerio-tableparser');
const Axios = require('Axios');
const moment = require('moment');
const decode = require('windows-1250').decode;

const URL_PROXY = 'https://cors-anywhere.herokuapp.com/';
const URL_SUPL = 'suplovani.gytool.cz/';
const URL_ROZVRH = 'rozvrh.gytool.cz/index_Trida_Menu.html';
const URL_DATES = URL_SUPL + '!index_menu.html';

var axios = Axios.create({
	baseURL: URL_PROXY,
	timeout: 10000,
	headers: { 'X-Requested-With': 'gytool.cz' }, // Also set the origin to gytool
	transformResponse: [function (data) {
		return decode(data);
	}]
});

function getClasses() {
	return new Promise((resolve, reject) => {
		axios.get(URL_ROZVRH).then((res) => {
			if (res.status != 200) {
				throw new URIError('Error loading rozvrh page | Code: ' + res.status);
			}
			let options = $(res.data).find('option');
			let values = options.map((i, option) => {
				return $(option).text();
			});
			let classes = values.toArray();
			resolve(classes);
		}).catch((err) => {
			reject(err);
		});
	});
}

function getSuplovani(date_url) {
	return new Promise((resolve, reject) => {
		axios.get(URL_SUPL + date_url).then((res) => {
			let page = $(res.data);
			let suplovani_table = $(page).find('div:contains("Suplování")').next();
			let supl = parseTable($, suplovani_table);
			resolve(supl);
		}).catch((err) => {
			reject(err);
		});
	});
}

function getDates() {
	return new Promise((resolve, reject) => {
		axios.get(URL_DATES).then((res) => {
			let options = $(res.data).find('option');
			let data = options.map((i, option) => {
				return {
					url: $(option).attr('value'),
					date: moment($(option).text().split(' ').slice(2).toString(' ').replace(',', '').replace(',', '').replace('.', '/').replace('.', '/').replace('.', '/'), 'DD/MM/YYYY')
				};
			});
			resolve(data.toArray());
		}).catch((err) => {
			reject(err);
		});
	});
}

module.exports = { getClasses, getSuplovani, getDates };