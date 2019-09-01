const merge = require("webpack-merge");
const common = require("./webpack.common.js");
require('style-loader');
require('css-loader');

const serverHost = process.env.DEV_SERVER_HOST || "192.168.88.200";

module.exports = merge(common, {
	mode: "development",
	devServer: {
		host: serverHost
	},
	devtool: "source-map",
	module: {
		rules: [{
			test: /\.css$/,
			use: [
				{
					loader: "style-loader"
				}, {
					loader: "css-loader"
				}
			]
		}]
	}
});
