/* eslint max-len: off, quotes:off */
import test from 'ava';
import path from 'path';
import denodeify from 'denodeify';
import NitroWebpack from '..';
import configResolver from '../lib/resolve-config.js';
import configEnhancer from '../lib/enhance-config.js';

const fixtures = path.resolve(__dirname, 'fixtures');

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

test('should throw an error if the webpack config was not found', async t => {
	const webpackDirectory = path.join(fixtures, 'simple', 'project', 'webpack');
	const err = getErrorMessage(() => {
		configResolver.resolveWebpackConfig(webpackDirectory, 'dev');
	});
	t.is(err, `Couldn't find a config of type "dev" in "${webpackDirectory}".`);
});

test('should find the prod config in the folder', async t => {
	const webpackDirectory = path.join(fixtures, 'simple', 'project', 'webpack');
	const config = configResolver.resolveWebpackConfig(webpackDirectory, 'prod');
	t.is(config, path.join(webpackDirectory, 'webpack.config.prod.js'));
});

test('should load the prod config in the folder', async t => {
	const webpackDirectory = path.join(fixtures, 'simple', 'project', 'webpack');
	const config = configResolver.loadConfig(webpackDirectory, 'prod');
	t.is(config.entry, './entry.js');
});

test('add the context', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const baseConfig = {};
	configEnhancer._addContext(baseConfig, rootDirectory);
	t.is(baseConfig.context, rootDirectory);
});

test('should not overwrite the context', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const baseConfig = { context: 'demo' };
	configEnhancer._addContext(baseConfig, rootDirectory);
	t.is(baseConfig.context, 'demo');
});

test('add the self-reference', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const baseConfig = {};
	configEnhancer._addSelfReference(baseConfig, rootDirectory);
	t.is(baseConfig.resolve.alias['simple-integration-test'], rootDirectory);
});

test('should not overwrite the self-reference', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const baseConfig = { resolve: { alias: { 'simple-integration-test': 'demo' } } };
	configEnhancer._addSelfReference(baseConfig, rootDirectory);
	t.is(baseConfig.resolve.alias['simple-integration-test'], 'demo');
});

test('add the node modules resolve fallback', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const baseConfig = {};
	configEnhancer._addNodeModulesFallback(baseConfig, rootDirectory);
	t.deepEqual(baseConfig.resolve.fallback, [path.join(rootDirectory, 'node_modules')]);
});

test('add the node modules resolve fallback to an existing fallback', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const baseConfig = { resolve: { fallback: 'demo' } };
	configEnhancer._addNodeModulesFallback(baseConfig, rootDirectory);
	t.deepEqual(baseConfig.resolve.fallback, ['demo', path.join(rootDirectory, 'node_modules')]);
});

test('add sourcemaps', async t => {
	const baseConfig = {};
	configEnhancer._addSourcemaps(baseConfig);
	t.is(baseConfig.devtool, 'cheap-module-eval-source-map');
});

test('should not overwrite the dev tool setting', async t => {
	const baseConfig = { devtool: 'eval', plugins: [] };
	configEnhancer._addSourcemaps(baseConfig);
	t.is(baseConfig.devtool, 'eval');
});

test('should add hot module replacement for a string entry', async t => {
	const baseConfig = { entry: './demo.js' };
	configEnhancer._addHotModuleReplacement(baseConfig, '/');
	t.deepEqual(baseConfig.entry, [
		`${require.resolve('webpack-hot-middleware/client.js')}?path=/__webpack_hmr&timeout=20000&noInfo=true&reload=false`,
		'./demo.js'
	]);
});

test('should add dev presets', async t => {
	const baseConfig = { entry: './demo.js' };
	configEnhancer.addDevPresets(baseConfig, '/');
	t.deepEqual(baseConfig.entry, [
		`${require.resolve('webpack-hot-middleware/client.js')}?path=/__webpack_hmr&timeout=20000&noInfo=true&reload=false`,
		'./demo.js'
	]);
});

test('should add hot module replacement for an object entry', async t => {
	const baseConfig = { entry: { demo: './demo.js' } };
	configEnhancer._addHotModuleReplacement(baseConfig, '/');
	t.deepEqual(baseConfig.entry.demo, [
		`${require.resolve('webpack-hot-middleware/client.js')}?path=/__webpack_hmr&timeout=20000&noInfo=true&reload=false`,
		'./demo.js'
	]);
});

// Integration tests
test('should compile a configuration that requires a correct context', async t => {
	const rootDirectory = path.join(fixtures, 'simple');
	const nitroWebpack = new NitroWebpack.Production(rootDirectory, {});
	const compiler = await nitroWebpack.getCompiler();
	const stats = await denodeify(compiler.run).call(compiler);
	t.deepEqual(stats.compilation.errors, []);
});

test('should be able to self reference the module in require statements', async t => {
	const rootDirectory = path.join(fixtures, 'self-reference');
	const nitroWebpack = new NitroWebpack.Production(rootDirectory, {});
	const compiler = await nitroWebpack.getCompiler();
	const stats = await denodeify(compiler.run).call(compiler);
	t.deepEqual(stats.compilation.errors, []);
});

test('should be able to use a linked module', async t => {
	const rootDirectory = path.join(fixtures, 'npm-link/main');
	const nitroWebpack = new NitroWebpack.Production(rootDirectory, {});
	const compiler = await nitroWebpack.getCompiler();
	const stats = await denodeify(compiler.run).call(compiler);
	t.deepEqual(stats.compilation.errors, []);
});

