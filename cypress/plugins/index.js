const webpack = require('@cypress/webpack-preprocessor');

module.exports = (on) => {
	const options = {
		webpackOptions: {
			module: {
				rules: [
					{
						test: /\.jsx?$/,
						exclude: [/node_modules/],
						use: [{
							loader: 'babel-loader',
							options: {
								presets: [
									['babel-preset-es2015', {
										"targets": {
											"chrome": 64
										}
									}],
									'babel-preset-react'
								],
							},
						}],
					},
				],
			},
		},
		watchOptions: {},
	};

	on('file:preprocessor', webpack(options));
};