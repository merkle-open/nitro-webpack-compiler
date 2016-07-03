var path = require('path');

module.exports = {
	entry: './components/entry.js',
	output: {
		path: path.resolve(__dirname, '../../public')
	}
};
