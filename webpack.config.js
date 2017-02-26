/* eslint-disable import/no-extraneous-dependencies */
const NODE_ENV = process.env.NODE_ENV || 'development';
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const RemoveWebpackPlugin = require('remove-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const functions = require('postcss-functions');
const precss = require('precss');
const atImport = require('postcss-import');
const easyImport = require('postcss-easy-import');
const postCssModules = require('postcss-modules');

const postCssLoader = [
	'css-loader?modules',
	'&importLoaders=1',
	'&localIdentName=[name]__[local]___[hash:base64:5]',
	'&disableStructuralMinification',
	'!postcss-loader',
];

module.exports = {
	devtool: 'source-map',
	entry: {
		index: './src/index.jsx',
	},
	output: {
		path: './dist',
		filename: '/static/js/[name].js',
	},
	plugins: [
		new RemoveWebpackPlugin('./dist', 'hide'),
		new webpack.NoErrorsPlugin(),
		new HtmlWebpackPlugin({
			template: './src/index.html',
			inject: false,
		}),
		new webpack.optimize.DedupePlugin(),
		new ExtractTextPlugin('static/css/styles.css', {}),
	],
	resolve: {
		moduleDirectories: ['node_modules'],
		extensions: ['', '.js', '.jsx'],
	},
	module: {
		loaders: [
			{
				test: /\.(js|jsx)$/,
				loaders: ['babel'],
				exclude: /node_modules/,
				include: __dirname,
			}, {
				test: /\.css$/,
				loader: ExtractTextPlugin.extract('style-loader', postCssLoader.join('')),
				exclude: /react-progress-button/,
			}, {
				test: /react-progress-button\.css$/,
				loader: ExtractTextPlugin.extract('style-loader', 'css-loader'),
			}, {
				test: /\.png$/,
				loader: 'file-loader?name=/static/images/[hash].[ext]',
			}, {
				test: /\.jpg$/,
				loader: 'file-loader?name=/static/images/[hash].[ext]',
			}, {
				test: /\.gif$/,
				loader: 'file-loader?name=/static/images/[hash].[ext]',
			}, {
				test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
				loader: 'file-loader?name=/static/fonts/[hash].[ext]',
			},
		],
	},
	postcss() {
		return [
			atImport({
				plugins: [easyImport],
			}),
			require('postcss-assets')({
				loadPaths: ['**'],
			}),
			require('postcss-mq-keyframes'),
			require('postcss-flexbugs-fixes'),
			postCssModules({
				scopeBehaviour: 'global',
				generateScopedName: '[name]__[local]___[hash:base64:5]',
			}),
			autoprefixer,
			precss(),
			require('postcss-mixins')({
				mixins: require('./src/styles/mixins'),
			}),
			require('postcss-simple-vars')({
				variables: require('./src/styles/vars'),
			}),
			functions(),
		];
	},
};

if (NODE_ENV === 'production') {
	postCssLoader.splice(1, 1); // drop human readable names
	delete module.exports.devtool;

	module.exports.plugins.push(
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
				drop_console: true,
				unsafe: true,
			},
		})
	);
}
