const path = require("path");
require('file-loader');
require('ts-loader');


module.exports = {
	entry: {
		/*"index": ["babel-polyfill", "whatwg-fetch", "./src/index.ts"],*/
		"tv": "./src/tv.ts"
	},
	devtool: "source-map",
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist")
	},
	resolve: {
		extensions: [".ts", ".js", ".json"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [{
					loader: "ts-loader",
					options: {
						transpileOnly: true,

					}
				}],
				exclude: [/node_modules/],
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
