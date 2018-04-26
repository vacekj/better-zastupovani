export const regexes = {
	trida: new RegExp("[IV|V?I]{0,4}\.[A-C][1-8]?|G[3-8]{6}"),
	ucebna: new RegExp("[1-8]\.[A-C][1-8]?d?|[ABC].{3}d?"),
	containsDate: new RegExp("pondělí|úterý|středa|čtvrtek|pátek")
};
