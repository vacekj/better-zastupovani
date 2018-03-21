const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(common, {
	module: {
		rules: [{
			test: /\.css$/,
			use: ExtractTextPlugin.extract({
				fallback: "style-loader",
				use: "css-loader"
			})
		}]
	},
	plugins: [
		new CleanWebpackPlugin(["dist/"]),
		new UglifyJsPlugin({
			cache: true,
			parallel: true,
			uglifyOptions: {
				ecma: 8
			}
		}),
		new ExtractTextPlugin("[name].css"),
	]
});
