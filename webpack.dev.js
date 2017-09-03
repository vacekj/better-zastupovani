const merge = require('webpack-merge');
const common = require('./webpack.common.js');
module.exports = merge(common, {
	devServer: {
		contentBase: './dist',
		host: '192.168.1.200'
	},
	devtool: 'eval-source-map',
});