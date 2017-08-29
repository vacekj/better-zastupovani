const path = require('path');

module.exports = {
	entry: './src/main.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.(html|css)$/,
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
			}
		]
	}
};

