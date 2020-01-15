const modbus = require('jsmodbus')
const UdpModbus = require('./udp-modbus')

/**
 *
 * @param {String} host
 * @param {Number} port
 */
function validateHostAndPort(host, port) {
	if (!host) {
		console.error('invalid `--host` parameter')
		process.exit(1)
	}

	if (typeof port != 'number' || isNaN(port) || port < 1 || port > 65535) {
		console.error('invalid `--port` parameter')
		process.exit(1)
	}
}

/**
 *
 * @param {String} protocol
 * @param {String} host
 * @param {Number} port
 * @returns {UdpModbus}
 */
module.exports = function initClient(protocol, host, port) {
	validateHostAndPort(host, port)

	if (protocol === 'udp') {
		return new UdpModbus(host, port)
	}

	return new modbus.client.tcp.complete({
		host,
		port,
		autoReconnect: false,
		timeout: 2500
	})
}