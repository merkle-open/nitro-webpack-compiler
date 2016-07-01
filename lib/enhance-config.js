'use strict';
const CssSourcemapPlugin = require('css-sourcemaps-webpack-plugin');
const validate = require('webpack-validator');
const _ = require('lodash');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

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
 * This function adds fixes to known webpack issues which might help in every nitro project
 * All fixes are only set if no configuration is set
 *
 * @param {object} baseWebpackConfig the webpack config
 * @param {string} nitroRootDirectory the root path of the main project
 * @returns {object} the webpack config
 */
function addBase(baseWebpackConfig, nitroRootDirectory) {
	const webpackConfig = _.clone(baseWebpackConfig);
	validate(webpackConfig);
	// Prepare the config
	webpackConfig.resolve = webpackConfig.resolve || {};
	webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};
	// Set the resolve context for relative requirements e.g. require('./index.js'); to the root director
	if (!webpackConfig.context) {
		webpackConfig.context = nitroRootDirectory;
	}
	// Allow to require the module by its package name e.g. if you working on 'my-module'
	// require('my-module/components/atom/button/button.js');
	// or in scss
	// @import '~mymodule/components/atom/button/button.scss';
	const packageName = JSON.parse(fs.readFileSync(path.join(nitroRootDirectory, 'package.json'))).name;
	if (!webpackConfig.resolve.alias[packageName]) {
		webpackConfig.resolve.alias[packageName] = nitroRootDirectory;
	}
	// Webpacks enhanced resolve doesn't work with npm link properly
	// http://webpack.github.io/docs/troubleshooting.html#npm-linked-modules-doesn-t-find-their-dependencies
	// This workaround will add a fallback to the "real" node_moduels folder
	// First turn the string|undefined|array into a propper array
	webpackConfig.resolve.fallback = [].concat(webpackConfig.resolve.fallback);
	const nodeModulesDirectory = path.join(nitroRootDirectory, 'node_modules');
	if (webpackConfig.resolve.fallback.indexOf(nodeModulesDirectory) === -1) {
		webpackConfig.resolve.fallback.push(nodeModulesDirectory);
	}
	return webpackConfig;
}

// Exports
module.exports = {
	addDevTools,
	addBase
};

