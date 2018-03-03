const webpack = require('@cypress/webpack-preprocessor');

module.exports = (on) => {
	const options = {

		webpackOptions: {
			entry: ["babel-polyfill"],
			module: {
				rules: [
					{
						test: /\.jsx?$/,
						exclude: [/node_modules/],
						use: [{
							loader: 'babel-loader',
							options: {
								presets: [
									'babel-preset-stage-3',
									'babel-preset-react',
								],
							},
						}],
					},
				],
			},
		},
		watchOptions: {},
	}

	on('file:preprocessor', webpack(options))
}