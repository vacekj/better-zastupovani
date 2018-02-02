const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

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
		new CleanWebpackPlugin(['dist/']),
		new ExtractTextPlugin('style.css')
	]
});