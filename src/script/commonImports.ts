/* Imports shared across pages */

// Polyfills
import "../lib/utils/DOMParserPolyfill";

// Bootstrap imports
import "../styles/vendor/bootstrap-md.min.css";

// Misc
import "../img/favicon.png";
import "../robots.txt";

// SW
const req = require.context("../img/icons", true, /^(.*\.(png$))[^.]*$/);
req.keys().forEach((key) => {
	req(key);
});

// Images
import "../img/gh.png";
import "../img/pecet.jpg";
