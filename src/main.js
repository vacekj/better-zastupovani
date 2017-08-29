// Webpack imports
import index from './index.html';
import style from './style.css';

import $ from 'jquery';
import * as supl from './supl';

$(document).ready(() => {
	supl.getClasses().then(result => {
		console.log(result);
	});
});