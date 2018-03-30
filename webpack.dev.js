const merge = require("webpack-merge");
const common = require("./webpack.common.js");
require('style-loader');
require('css-loader');

module.exports = merge(common, {
	mode: "development",
	devServer: {
		host: "0.0.0.0"
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
