/**
 * webpack configuration
 */

const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
	entry: './src/ui/script.ts',
	module: {
		rules: [{
			test: /\.vue$/,
			exclude: /node_modules/,
			use: [{
				loader: 'vue-loader',
				options: {
					cssSourceMap: false,
					compilerOptions: {
						preserveWhitespace: false
					}
				}
			}]
		}, {
			test: /\.styl(us)?$/,
			exclude: /node_modules/,
			oneOf: [{
				resourceQuery: /module/,
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						modules: true
					}
				}, {
					loader: 'stylus-loader'
				}]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader'
				}, {
					loader: 'stylus-loader'
				}]
			}]
		}, {
			test: /\.css$/,
			use: [{
				loader: 'vue-style-loader'
			}, {
				loader: 'css-loader'
			}]
		}, {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					happyPackMode: true,
					appendTsSuffixTo: [/\.vue$/]
				}
			}]
		}]
	},
	plugins: [
		new VueLoaderPlugin(),
	],
	output: {
		path: __dirname + '/built/ui',
		filename: `[name].js`,
		publicPath: `/assets/`
	},
	resolve: {
		extensions: [
			'.js', '.ts', '.json'
		],
	},
	resolveLoader: {
		modules: ['node_modules']
	},
	cache: true,
	devtool: false, //'source-map',
	mode: 'development'
};
