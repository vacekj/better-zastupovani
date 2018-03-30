const path = require("path");
require('file-loader');
require('ts-loader');
const OfflinePlugin = require('offline-plugin');

module.exports = {
	entry: {
		"index": ["babel-polyfill", "whatwg-fetch", "./src/index.ts"],
		"tv": "./src/tv.ts"
	},
	devtool: "source-map",
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist")
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [{
					loader: "ts-loader",
					options: {
						transpileOnly: true
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
				test: /\.(json)$/,
				type: "javascript/auto",
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
	},
	plugins: [
		new OfflinePlugin({
			publicPath: "/test-site/",
			responseStrategy: 'network-first',
			ServiceWorker: {
				minify: false
			},
			AppCache: false,
			autoUpdate: true
		})
	]
};
