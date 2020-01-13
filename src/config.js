module.exports = require('yargs')
.options({
	'host': {
		default: 'localhost',
		describe: 'Address of the host running modbus server',
		type: 'string',
		alias: 'h',
	},
	'port': {
		default: 502,
		describe: 'Port on which modbus server is listening',
		type: 'number',
		alias: 'p',
	},
	'proto': {
		default: 'tcp',
		describe: 'Protocol used for modbus communication, valid options are `tcp` and `udp`',
		type: 'string',
		alias: 'P',
	},
	'headless': {
		default: false,
		describe: 'If set, given command will be executed affter connection is established, it\'s result will be printed to stdout and afterwards process will exit',
		type: 'boolean',
		alias: 'H',
	},
	'command': {
		default: null,
		describe: 'Command to be executed in headless mode',
		type: 'string',
		alias: 'c',
	},
})
.help()
.argv