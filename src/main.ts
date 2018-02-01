// Bootstrap imports
import './bootstrap-md.min.css';

// Webpack imports
import './favicon.png';
import './index.html';
import './style.css';

import * as $ from 'jquery';
import * as Cookies from 'js-cookie';

import { compareAsc, format, isEqual } from 'date-fns';
import { SuplGetterBrowser } from './lib/suplGetter';
import { SuplUtil } from './lib/SuplUtil';

let suplUtil = new SuplUtil(new SuplGetterBrowser());
