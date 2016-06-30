'use strict';
const CssSourcemapPlugin = require('css-sourcemaps-webpack-plugin');
const validate = require('webpack-validator');
const _ = require('lodash');
const webpack = require('webpack');

/**
 * Adds the configured hmr script
 *
 * @param {string|array} entries Webpack entry points
 * @param {string} appMountPath the middleware mount path e.g. '/'
 * @return {array} entries
 */
function _prependHotModuleReplacement(entries, appMountPath) {
	const mountpath = appMountPath.replace(/[/]$/, '');
	const hmrOptions = `path=${mountpath}/__webpack_hmr&timeout=20000&noInfo=true&reload=false`;
	return [
		`${require.resolve('webpack-hot-middleware/client')}?${hmrOptions}`
	].concat(entries);
}

/**
 * Returns an enhanced version of the webpackConfig
 * @param {object} baseWebpackConfig the webpack config
 * @param {string} appMountPath the middleware mount path e.g. '/'
 * @returns {object} the webpack config
 */
function addDevTools(baseWebpackConfig, appMountPath) {
	const webpackConfig = _.clone(baseWebpackConfig);

	webpackConfig.plugins = webpackConfig.plugins || [];
	// Source Map dev tool
	// https://webpack.github.io/docs/configuration.html#devtool
	webpackConfig.devtool = webpackConfig.devtool || 'cheap-module-eval-source-map';
	// CSS Source maps
	webpackConfig.plugins.push(new CssSourcemapPlugin());
	// Hot module replacement plugin
	webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
	// Add hot module replacement for each entry
	if (typeof webpackConfig.entry === 'string') {
		webpackConfig.entry = _prependHotModuleReplacement(webpackConfig.entry, appMountPath);
	} else if (typeof webpackConfig.entry === 'object') {
		Object.keys(webpackConfig.entry).forEach((entryName) => {
			webpackConfig.entry[entryName] = _prependHotModuleReplacement(webpackConfig.entry[entryName], appMountPath);
		});
	}

	return webpackConfig;
}

/**
 * Returns an enhanced version of the webpackConfig
 * @param {object} baseWebpackConfig the webpack config
 * @param {string} nitroRootDirectory the root path of the main project
 * @returns {object} the webpack config
 */
function addBase(baseWebpackConfig, nitroRootDirectory) {
	const webpackConfig = _.clone(baseWebpackConfig);
	validate(webpackConfig);
	if (!webpackConfig.context) {
		webpackConfig.context = nitroRootDirectory;
	}

	return webpackConfig;
}

// Exports
module.exports = {
	addDevTools,
	addBase
};

