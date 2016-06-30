'use strict';
const path = require('path');
const resolveWebpackConfig = require('./resolve-config.js');
const configEnhancer = require('./enhance-config.js');

/**
 * Load, parse, validate and enhance the config to be used for prod and dev
 * @param {string} nitroRootDirectory The main module root directory
 * @param {object} options the nitro/app/core/config
 * @param {string} type the webpack config type e.g. 'prod' or 'dev'
 * @param {object} baseWebpackConfig optional - if passed this webpack config will be
 * 	used instead of the one inside the project/webpack folder
 * @return {object} webpack config
 */
function getBaseConfig(nitroRootDirectory, options, type, baseWebpackConfig) {
	let webpackConfig = baseWebpackConfig;
	if (!baseWebpackConfig) {
		const nitroWebpackDirectory = path.join(nitroRootDirectory, 'project/webpack');
		webpackConfig = resolveWebpackConfig.loadConfig(nitroWebpackDirectory, type);
	}
	return configEnhancer.addBase(webpackConfig, nitroRootDirectory);
}

module.exports = getBaseConfig;
