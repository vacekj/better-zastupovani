import { SuplGetter } from "./supl_getter";
export class SuplGetterBrowser extends SuplGetter {

}

const request_ = require('request');
const iconv = require('iconv-lite');

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

module.exports = { getClasses, getSuplovani, getDatesPage };