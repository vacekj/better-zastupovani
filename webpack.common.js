const path = require('path');

module.exports = {
	entry: {
		main: './src/main.ts',
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.(html)$/,
				use: [{
					loader: 'file-loader',
					options: {
						context: path.resolve(__dirname, 'src'),
						outputPath: '',
						name: '[name].[ext]',
					}
				}]
			},
			{
				test: /\.(png|jpg|gif)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							context: path.resolve(__dirname, 'src'),
							outputPath: '',
							name: '[name].[ext]'
						}
					}
				]
			}]
	}
};

