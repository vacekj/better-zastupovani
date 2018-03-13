const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const ClosureCompilerPlugin = require('webpack-closure-compiler');
const SentryCliPlugin = require('@sentry/webpack-plugin');

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
		new ExtractTextPlugin("[name].css"),
		new SentryCliPlugin({
			include: './dist',
			ignore: ['node_modules', 'webpack.config.js'],
			configFile: '.sentryclirc'
		}),
		new ClosureCompilerPlugin({
			compiler: {
				language_in: 'ECMASCRIPT_2017',
				language_out: 'ECMASCRIPT5'
			},
			concurrency: 5,
		})
	]
});
