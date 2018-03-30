const merge = require("webpack-merge");
const common = require("./webpack.common.js");
require('style-loader');
require('css-loader');

const serverHost = process.env.DEV_SERVER_HOST || "0.0.0.0";

module.exports = merge(common, {
	mode: "development",
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
