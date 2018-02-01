const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const ClosureCompilerPlugin = require('webpack-closure-compiler');
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
		new ClosureCompilerPlugin({
			compiler: {
				language_in: 'ECMASCRIPT_NEXT',
				language_out: 'ECMASCRIPT5'
			},
			concurrency: 3,
		}),
		new ExtractTextPlugin('style.css'),
	]
});