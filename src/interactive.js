const readline = require('readline')
const initClient = require('./init-modbus-client')
const parseCommand = require('./command-parser')
const {
	host,
	port,
	proto,
} = require('./config')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

module.exports = function() {
	const client = initClient(proto, host, port)
	client.connect()

	client.on('connect', () => {
		console.log('Connection established')
		promptForCommand(host, port, client)
	})

	client.on('error', err => {
		rl.close()
		console.error(err)
	})
}

function promptForCommand(host, port, client) {
	rl.question(`${host}:${port} > `, (answer) => {
		if (answer === 'exit' || answer === 'quit') {
			client.close()
			rl.close()
		} else {
			parseCommand(client, answer, (printable, err) => {
				if (err) {
					console.error(err)
				}

				if (printable) {
					printable.printPretty()
				}

				promptForCommand(host, port, client)
			})
		}
	})
}
