const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(common, {
	mode: "production",
	module: {
		rules: [{
			test: /\.css$/,
			use: [MiniCssExtractPlugin.loader, "css-loader"]
		}]
	},
	devtool: "source-map",
	optimization: {
		minimizer: [
			new UglifyJsPlugin({
				cache: true,
				parallel: true,
				sourceMap: true,
				uglifyOptions: {
					ecma: 8
				}
			}),]
	},
	plugins: [
		new CleanWebpackPlugin(["dist/"]),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css"
		})
	]
});
