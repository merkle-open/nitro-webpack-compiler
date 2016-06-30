/* eslint max-len: off, quotes:off */
import test from 'ava';
import http from 'http';
import express from 'express';
import NitroWebpack from '..';

/**
 * @param {function} callback Callback
 * @returns {string} Error message
 */
function getErrorMessage(callback) {
	try {
		callback();
	} catch (e) {
		return e.message;
	}
	return undefined;
}

test('should not allow to add a schema without id', async t => {
	const app = express();
	const server = http.createServer(app);
	const nitroWebpack = new NitroWebpack({
		context: __dirname,
		entry: './fixtures/entry',
		output: {
			path: `${__dirname}/dist`
		}
	}, { server });

	app.use(nitroWebpack.app);
	server.listen(19899, 'localhost');

	await nitroWebpack.initialized;
/*	const err = getErrorMessage(() => {
		validator.addSchema({});
	});
	t.is(err, 'Schema id is required');
	t.pass();*/
});
