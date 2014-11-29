var mongoose = require('mongoose');

module.exports = mongoose.model('artifact', new mongoose.Schema({
	project: String,
	job: String,
	version: String,
	date: Date,
	artifact: {
		name: String,
		data: Buffer
	}
}));
