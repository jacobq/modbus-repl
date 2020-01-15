const { headless } = require('./config')

if (headless) {
	require('./headless')()
} else {
	require('./interactive')()
}
