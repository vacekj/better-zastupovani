interface IOptions {
	containerSelector: string;
	showWhenScrollTopIs: number;
	backgroundColor: string;
	diameter: number;
	textColor: string;
	id: string;
	innerHTML: string;
	onClickScrollTo: number;
	scrollDuration: number;
	cornerOffset: number;
	zIndex: number;
}

export function addBackToTop(options: Partial<IOptions>) {
	const id = options.id || "back-to-top";
	const innerHTML = options.innerHTML || '<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path></svg>';
	const diameter = options.diameter || 56;
	const onClickScrollTo = options.onClickScrollTo || 0;
	const scrollDuration = options.scrollDuration || 100;
	const containerSelector = options.containerSelector || "body";
	const cornerOffset = options.cornerOffset || 20;
	const backgroundColor = options.backgroundColor || "#000";
	const textColor = options.textColor || "#fff";
	const zIndex = options.zIndex || 1;

	appendStyles();
	const upEl = appendElement();
	let hidden = true;
	document.addEventListener("scroll", adapt);
	adapt();

	function adapt() {
		getScrollTop() >= options.showWhenScrollTopIs ? show() : hide();
	}

	function show() {
		if (!hidden) {
			return;
		}

		upEl.className = "";
		hidden = false;
	}

	function hide() {
		if (hidden) {
			return;
		}

		upEl.className = "hidden";
		hidden = true;
	}

	function appendElement() {
		const upElement = document.createElement("div");
		upElement.id = id;
		upElement.className = "hidden";
		upElement.innerHTML = innerHTML;

		upElement.addEventListener("click", (event) => {
			event.preventDefault();
			scrollUp();
		});
		document.body.appendChild(upElement);
		return upElement;
	}

	function appendStyles() {
		const svgSize = Math.round(0.43 * diameter);
		const svgTop = Math.round(0.29 * diameter);
		const styles = `
		#${id} {
			background:${backgroundColor};
			-webkit-border-radius:50%;
			-moz-border-radius:50%;
			border-radius:50%;
			bottom:${cornerOffset}px;
			-webkit-box-shadow:0 2px 5px 0 rgba(0,0,0,.26);
			-moz-box-shadow:0 2px 5px 0 rgba(0,0,0,.26);
			box-shadow:0 2px 5px 0 rgba(0,0,0,.26);
			color:${textColor};
			cursor:pointer;
			display:block;
			height:${diameter}px;
			opacity:1;
			outline:0;
			position:fixed;
			right:${cornerOffset}px;
			-webkit-tap-highlight-color:transparent;
			-webkit-touch-callout:none;
			-webkit-transition:bottom .2s,opacity .2s;
			-o-transition:bottom .2s,opacity .2s;
			-moz-transition:bottom .2s,opacity .2s;
			transition:bottom .2s,opacity .2s;
			-webkit-user-select:none;
			-moz-user-select:none;
			-ms-user-select:none;
			user-select:none;
			width:${diameter}px;
			z-index:${zIndex};
		}

		#${id} svg {
			display:block;
			fill:currentColor;
			height:${svgSize}px;
			margin:${svgTop}px auto 0;
			width:${svgSize}px;
		}

		#${id}.hidden {
			bottom:-${diameter}px;
			opacity:0;
		}`;

		const styleEl = document.createElement("style");
		styleEl.appendChild(document.createTextNode(styles));
		document.head.insertAdjacentElement("afterbegin", styleEl);
	}

	function scrollUp() {
		if (scrollDuration <= 0 || typeof performance === "undefined" || typeof requestAnimationFrame === "undefined") {
			return setScrollTop(onClickScrollTo);
		}

		const start = performance.now();
		const initScrollTop = getScrollTop();
		const pxsToScrollBy = initScrollTop - onClickScrollTo;
		window.requestAnimationFrame(step);

		function step(timestamp) {
			const delta = timestamp - start;
			const progress = Math.min(delta / scrollDuration, 1);
			setScrollTop(initScrollTop - Math.round(progress * pxsToScrollBy));

			if (progress < 1) {
				requestAnimationFrame(step);
			}
		}
	}

	function getScrollTop() {
		return document.documentElement.scrollTop || 0;
	}

	function setScrollTop(value) {
		document.documentElement.scrollTop = value;
	}
}
