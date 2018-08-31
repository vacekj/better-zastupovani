export const regexes = {
	trida: new RegExp("[IV|V?I]{0,4}\.[A-C][1-8]?|G[3-8]{6}"),
	ucebna: new RegExp("[1-8]\.[A-C][1-8]?d?|[ABC].{3}d?"),
	date: new RegExp("([0-2][0-9]|(3)[0-1])(\.)(((0)[0-9])|((1)[0-2]))(\.)\d{4}", "i")
};
