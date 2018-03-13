const path = require("path");
require('file-loader');
require('ts-loader');


module.exports = {
	entry: {
		"main": ["babel-polyfill", "whatwg-fetch", "./src/main.ts"],
		"tv": "./src/tv.ts"
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
		sourceMapFilename: "[name].js.map"
	},
	resolve: {
		extensions: [".ts", ".js", ".json"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: [/node_modules/]
			},
			{
				test: /\.(html|txt)$/,
				use: [{
					loader: "file-loader",
					options: {
						context: path.resolve(__dirname, "src"),
						outputPath: "",
						name: "[name].[ext]",
					}
				}]
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							context: path.resolve(__dirname, "src"),
							outputPath: "",
							name: "[path][name].[ext]"
						}
					}
				]
			}]
	}
};
