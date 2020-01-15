const process = require('process')
const initClient = require('./init-modbus-client')
const parseCommand = require('./command-parser')
const {
	host,
	port,
	proto,
	command,
} = require('./config')

module.exports = function() {
	if (!command) {
		console.error('headless mode requires `--command` argument')
		process.exit(1)
	}

	const client = initClient(proto, host, port)
	client.connect()

	client.on('connect', () => {
		parseCommand(client, command, (printable, err) => {
			if (err) {
				console.error(err)
			}

			if (printable) {
				printable.printJson()
			}

			client.close()
			process.exit(0)
		})
	})

	client.on('error', console.error)
}