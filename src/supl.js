const $ = require('cheerio');
const parseTable = require('./cheerio-tableparser');
const Axios = require('Axios');
const moment = require('moment');
const decode = require('windows-1250').decode;

const URL_PROXY = 'https://cors-anywhere.herokuapp.com/';
const URL_SUPL = 'suplovani.gytool.cz/';
const URL_ROZVRH = 'rozvrh.gytool.cz/index_Trida_Menu.html';
const URL_DATES = URL_SUPL + '!index_menu.html';

var axios;

function init() {
	axios = Axios.create({
		baseURL: needsProxy() ? URL_PROXY : '', // Proxy everything thru the CORS proxy to avoid silly SOP limitations (sigh)
		timeout: 10000,
		headers: { 'X-Requested-With': 'gytool.cz' }, // Also set the origin to gytool
		transformResponse: [function (data) {
			return decode(data);
		}]
	});
}

function needsProxy() {
	return new Promise((resolve, reject) => {
		let instanceWithOrigin = Axios.create({
			timeout: 10000,
			headers: { 'X-Requested-With': 'gytool.cz' },
			transformResponse: [function (data) {
				return decode(data);
			}],
		});

		instanceWithOrigin.get('http://' + URL_SUPL).then((res) => {
			return false;
		}, (err) => {
			return true;
		});
	});
}

// Config Http padding
axios.interceptors.request.use(function (config) {
	let fixedConfig = config;
	if (!needsProxy()) {
		fixedConfig.url = 'http://' + fixedConfig.url;
	}
	return fixedConfig;
}, function (error) {
	return Promise.reject(error);
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