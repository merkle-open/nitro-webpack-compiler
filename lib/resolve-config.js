'use strict';
const globule = require('globule');
const path = require('path');

/**
 * Searches in the given directory for a `webpack.config.[type].js` file.
 * If no type is given it will return the path of `webpack.config.js` if it exists.
 * @param {string} directory the directory of the config files
 * @param {string} type optional type e.g. 'dev', 'prod', ''
 * @returns {string} absolute file path of the config
 */
function resolveWebpackConfig(directory, type) {
	const configs = globule.find('webpack.config.*', { srcBase: directory });
	const regexp = /^webpack\.config\.(?:([^.]+)\.|)[^.]+$/;
	const configTypes = {};
	configs
		.forEach((config) => {
			const result = regexp.exec(config);
			if (result) {
				configTypes[result[1] || ''] = path.join(directory, config);
			}
		});
	return configTypes[type || ''];
}

/**
 * Searches in the given directory for a `webpack.config.[type].js` file.
 * If no type is given it will return the path of `webpack.config.js` if it exists.
 * @param {string} directory the directory of the config files
 * @param {string} type optional type e.g. 'dev', 'prod', ''
 * @returns {object} the webpack config
 */
function loadConfig(directory, type) {
	const config = resolveWebpackConfig(directory, type);
	if (!config) {
		throw new Error(`Couldn't find a config of type "${type}" in "${directory}".`);
	}
	// eslint-disable-next-line
	return require(config);
}

// Exports
module.exports = {
	loadConfig,
	resolveWebpackConfig
};

