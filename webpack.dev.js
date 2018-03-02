const merge = require("webpack-merge");
const common = require("./webpack.common.js");
require('style-loader');
require('css-loader');

const serverHost = process.env.DEV_SERVER_HOST || "192.168.1.200";

module.exports = merge(common, {
	devServer: {
		host: serverHost
	},
	devtool: "inline-source-map",
	module: {
		rules: [{
			test: /\.css$/,
			use: [
				{
					loader: "style-loader"
				}, {
					loader: "css-loader",
					options: {
						minimize: true
					}
				}
			]
		}]
	}
});
