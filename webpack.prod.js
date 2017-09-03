const merge = require('webpack-merge');
const common = require('./webpack.common.js');
var CompressionPlugin = require("compression-webpack-plugin");
const ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = merge(common, {
	plugins: [
		new ClosureCompilerPlugin({
			compiler: {
				language_in: 'ECMASCRIPT6',
				language_out: 'ECMASCRIPT5'
			},
			concurrency: 3,
		}),
		new CompressionPlugin({
			asset: "[path].gz[query]",
			algorithm: "gzip",
			test: /\.(js|html)$/,
			threshold: 10240,
			minRatio: 0.8
		})
	]
});