/* eslint no-param-reassign: off */
'use strict';
const CssSourcemapPlugin = require('css-sourcemaps-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

/**
 * The context is the base were webpack will resolve relative dependencies from.
 * This helper function will make sure that the context is set
 *
 * @param {object} webpackConfig the webpack config
 * @param {string} contextDirectory the absolute path of the context directory
 * @returns {undefined}
 */
function _addContext(webpackConfig, contextDirectory) {
	if (!webpackConfig.context) {
		webpackConfig.context = contextDirectory;
	}
}

/**
 * Allow to require the module by its package name e.g. if you working on 'my-module'
 * in js
 * - require('my-module/components/atom/button/button.js');
 * in scss
 * - @import '~mymodule/components/atom/button/button.scss';
 *
 * @param {object} webpackConfig the webpack config
 * @param {string} moduleDirectory the absolute path of the module directory
 * @returns {undefined}
 */
function _addSelfReference(webpackConfig, moduleDirectory) {
	// Prepare the config
	webpackConfig.resolve = webpackConfig.resolve || {};
	webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};
	const packageName = JSON.parse(fs.readFileSync(path.join(moduleDirectory, 'package.json'))).name;
	if (!webpackConfig.resolve.alias[packageName]) {
		webpackConfig.resolve.alias[packageName] = moduleDirectory;
	}
}

/**
 * Webpacks enhanced resolve doesn't work with npm link properly
 * http://webpack.github.io/docs/troubleshooting.html#npm-linked-modules-doesn-t-find-their-dependencies
 * This workaround will add a fallback to the "real" node_modules folder
 *
 * @param {object} webpackConfig the webpack config
 * @param {string} moduleDirectory the absolute path of the module directory
 * @returns {undefined}
 */
function _addNodeModulesFallback(webpackConfig, moduleDirectory) {
	// Prepare the config
	webpackConfig.resolve = webpackConfig.resolve || {};
	// First turn the string|undefined|array into a propper array
	webpackConfig.resolve.fallback = [].concat(webpackConfig.resolve.fallback || []);
	const nodeModulesDirectory = path.join(moduleDirectory, 'node_modules');
	/* istanbul ignore else */
	if (webpackConfig.resolve.fallback.indexOf(nodeModulesDirectory) === -1) {
		webpackConfig.resolve.fallback.push(nodeModulesDirectory);
	}
}

/**
 * The dev tool setting tells webpack which sourcemap should be used.
 * They differ in speed and features. Some won't work with css
 * https://webpack.github.io/docs/configuration.html#devtool
 *
 * @param {object} webpackConfig the webpack config
 * @returns {undefined}
 */
function _addSourcemaps(webpackConfig) {
	webpackConfig.devtool = webpackConfig.devtool || 'cheap-module-eval-source-map';
	// CSS Source maps
	webpackConfig.plugins = webpackConfig.plugins || [];
	webpackConfig.plugins.push(new CssSourcemapPlugin());
}

/**
 * Adds hot module replacement (advanced live reload)
 *
 * @param {object} webpackConfig the webpack config
 * @param {string} appMountPath the middleware mount path e.g. '/'
 * @returns {undefined}
 */
function _addHotModuleReplacement(webpackConfig, appMountPath) {
	const _prependHotModuleReplacement = (entries) => {
		const mountpath = appMountPath.replace(/[/]$/, '');
		const hmrOptions = `path=${mountpath}/__webpack_hmr&timeout=20000&noInfo=true&reload=false`;
		return [
			`${require.resolve('webpack-hot-middleware/client')}?${hmrOptions}`
		].concat(entries);
	};
	webpackConfig.plugins = webpackConfig.plugins || [];
	webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
	// Add hot module replacement for each entry
	if (typeof webpackConfig.entry === 'string') {
		webpackConfig.entry = _prependHotModuleReplacement(webpackConfig.entry, appMountPath);
	} else {
		/* istanbul ignore else */
		if (typeof webpackConfig.entry === 'object') {
			Object.keys(webpackConfig.entry).forEach((entryName) => {
				webpackConfig.entry[entryName] = _prependHotModuleReplacement(webpackConfig.entry[entryName], appMountPath);
			});
		}
	}
}

/**
 * Returns an enhanced version of the webpackConfig
 * @param {object} webpackConfig the webpack config
 * @param {string} appMountPath the middleware mount path e.g. '/'
 * @returns {object} the webpack config
 */
function addDevPresets(webpackConfig, appMountPath) {
	// Add source maps
	_addSourcemaps(webpackConfig);
	// Hot module replacement plugin
	_addHotModuleReplacement(webpackConfig, appMountPath);
	return webpackConfig;
}

/**
 * This function adds fixes to known webpack issues which might help in every nitro project
 * All fixes are only set if no configuration is present
 *
 * @param {object} webpackConfig the webpack config
 * @param {string} nitroRootDirectory the root path of the main project
 * @returns {object} the webpack config
 */
function addBasePresets(webpackConfig, nitroRootDirectory) {
	// Set the resolve context for relative requirements e.g. require('./index.js'); to the root director
	_addContext(webpackConfig, nitroRootDirectory);
	// Allow to require the module by its package name e.g. if you working on 'my-module'
	// require('my-module/components/atom/button/button.js');
	// or in scss
	// @import '~mymodule/components/atom/button/button.scss';
	_addSelfReference(webpackConfig, nitroRootDirectory);
	// Fix npm link issues
	_addNodeModulesFallback(webpackConfig, nitroRootDirectory);
	return webpackConfig;
}

// Exports
module.exports = {
	addDevPresets,
	addBasePresets,
	// For unit tests
	_addContext,
	_addHotModuleReplacement,
	_addNodeModulesFallback,
	_addSelfReference,
	_addSourcemaps,
};

