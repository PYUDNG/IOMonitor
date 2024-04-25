const timing = {
	// Array to store timing points
	time: [],

	// Recored current timing point
	record(verbose_text=null) {
		this.time.push(Date.now());
		verbose_text && this.announce(verbose_text);
	},

	// Log last recorded timing point and its duration since previous one
	announce(text=null) {
		const label = typeof text === 'string' ? text[0].toUpperCase() + text.substring(1) : null;
		const header = label ? `${ label } at` : 'Timing';
		const point = this.time[this.time.length-1];

		if (this.time.length > 1) {
			const duration = point - this.time[this.time.length-2];
			console.log(`${ header } ${ point }, used ${ duration }`);
		} else if (this.time.length > 0) {
			console.log(`${ header } ${ point }`);
		} else {
			console.log('Trying to announce something but nothing recorded yet!');
		}
	},

	// Log all timing points recorded
	output() {
		console.log([...this.time]);
	}
}

module.exports = timing;