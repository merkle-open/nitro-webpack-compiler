'use strict';
const assert = require('assert');
const chalk = require('chalk');
const express = require('express');
const webpack = require('webpack');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackDevMiddleware = require('webpack-dev-middleware');
const configEnhancer = require('./enhance-config.js');
const getBaseConfig = require('./base-config.js');
const ip = require('ip');

class NitroWebpackDevelopment {

	constructor(nitroRootDirectory, options, webpackConfig) {
		assert(typeof options === 'object' && options.server, 'A server config is required');
		this.app = express();
		this.locals = {};
		this.nitroRootDirectory = nitroRootDirectory;
		// Get the base config
		this.webpackConfig = getBaseConfig(nitroRootDirectory, options, 'dev', webpackConfig);
		// Wait for mount and express boot up
		this.initialized = new Promise((resolve) => {
			this.app.once('mount', (parentApp) => resolve(parentApp));
		})
			.then((parentApp) => this._init(options, parentApp))
			.catch((err) => process.nextTick(() => {
				throw err;
			}));
		// Wait for webpack to compile
		this.online = this.initialized.then(() => new Promise((resolve) =>
			this.compiler.plugin('done', (stats) => {
				this.locals.stats = stats;
				resolve();
			}))).then(() => this._startupMessage());
	}

	/**
   * Returns the compiler instance as soon as it gets available
	 * @returns {Promise} Compiler
	 */
	getCompiler() {
		return this.initialized.then(() => this.compiler);
	}

	/**
	 * Initialize the app once its mounted
	 * @param {object} options The nitro/core/config
	 * @param {object} parentApp The parent express app
	 * @returns {Promise} The promise gets fullfilled once everything is ready
	 */
	_init(options, parentApp) {
		const mountpath = this.app.mountpath.replace(/[/]$/, '');
		// eslint-disable-next-line
		parentApp.locals.webpack = this.locals;
		this.url = `http://${ip.address()}:${options.server.port}`;
		configEnhancer.addDevPresets(this.webpackConfig, mountpath);
		// An absolute public path is required for css sourcemaps:
		this.webpackConfig.output.publicPath = this.webpackConfig.output.publicPath || `${this.url}${mountpath}/`;
		// Context for proper resolving
		if (!this.webpackConfig.context) {
			this.webpackConfig.context = this.nitroRootDirectory;
		}
		this.compiler = webpack(this.webpackConfig);
		this.app.use(webpackDevMiddleware(this.compiler, {
			noInfo: true
		}));
		this.app.use(webpackHotMiddleware(this.compiler));
	}

	/**
	 * Notification once the server is ready
	 * @returns {undefined}
	 */
	_startupMessage() {
		// http://www.emoji-cheat-sheet.com/
		// eslint-disable-next-line
		console.log(`\n\n \uD83D\uDD2E   ${chalk.blue.bold.underline(this.url)} \n\n`);
	}

}

module.exports = NitroWebpackDevelopment;
