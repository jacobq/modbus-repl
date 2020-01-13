module.exports = require('yargs')
.options({
	'host': {
		default: 'localhost',
		describe: '',
		type: 'string',
		alias: 'h',
	},
	'port': {
		default: 502,
		describe: '',
		type: 'number',
		alias: 'p',
	},
	'proto': {
		default: 'tcp',
		describe: '',
		type: 'string',
		alias: 'P',
	},
	'headless': {
		default: false,
		describe: '',
		type: 'boolean',
		alias: 'H',
	},
	'command': {
		default: null,
		describe: '',
		type: 'string',
		alias: 'c',
	},
})
.help()
.argv