const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ClosureCompiler = require('google-closure-compiler-js').webpack;

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
		new ExtractTextPlugin('style.css'),
		new ClosureCompiler({
			options: {
				languageIn: 'ECMASCRIPT_2017',
				languageOut: 'ECMASCRIPT5',
				warningLevel: 'QUIET'
			}
		})
	]
});