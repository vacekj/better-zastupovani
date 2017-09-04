const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: {
		main: './src/main.js',
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery',
			Popper: ['popper.js', 'default']
		})
	],
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.(html)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							context: path.resolve(__dirname, 'src'),
							outputPath: '',
							name: '[name].[ext]',
						}
					}
				]
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: "style-loader"
					}, {
						loader: "css-loader",
						options: {
							minimize: true
						}
					}
				]
			}]
	}
};

