'use strict';
const webpack = require('webpack');
const getBaseConfig = require('./base-config.js');

class NitroWebpackProduction {

	constructor(nitroRootDirectory, options, webpackConfig) {
		// Get the base config
		this.webpackConfig = getBaseConfig(nitroRootDirectory, options, 'prod', webpackConfig);
		this.compiler = webpack(this.webpackConfig);
	}

	/**
   * Returns the compiler instance as soon as it gets available
	 * @returns {Promise} Compiler
	 */
	getCompiler() {
		return Promise.resolve(this.compiler);
	}

}

module.exports = NitroWebpackProduction;
