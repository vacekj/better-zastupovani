const $ = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
cheerioTableparser($); // Changes the prototype
const Axios = require('Axios');
const moment = require('moment');

const URL_PROXY = 'https://cors-anywhere.herokuapp.com/';
const URL_SUPL = 'suplovani.gytool.cz/';
const URL_ROZVRH = 'rozvrh.gytool.cz/index_Trida_Menu.html';
const URL_DATES = URL_SUPL + '!index_menu.html';

var axios = Axios.create({
	baseURL: URL_PROXY, // Proxy everything thru the CORS proxy to avoid silly SOP limitations (sigh)
	timeout: 10000,
	headers: { 'X-Requested-With': 'gytool.cz' } // Also se the origin to gytool
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

function getSuplovani(url) {
	return new Promise((resolve, reject) => {
		axios.get(url).then((res) => {
			let page = $(res.data);
			let suplovani_table = $(page).find('div:contains("Suplování")').next();
			let data = $(suplovani_table).parseTable();
			resolve(data);
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
			resolve(data);
		}).catch((err) => {
			reject(err);
		});
	});
}

module.exports = { getClasses, getSuplovani, getDates };