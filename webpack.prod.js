const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = merge(common, {
	plugins: [
		new ClosureCompilerPlugin({
			compiler: {
				language_in: 'ECMASCRIPT6',
				language_out: 'ECMASCRIPT5'
			},
			concurrency: 3,
		})
	]
});