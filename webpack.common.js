const path = require('path');

module.exports = {
	entry: {
		main: './src/main.js',
	},
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

