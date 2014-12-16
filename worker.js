'use strict';

// Dependencies
var models = require('./model')

// Objects
var tasks = new require('./lib')(models.Artifact);

module.exports = {
	// Initialize the plugin for a job
	//   config: the config for this job, made by extending the DB config
	//           with any flat-file config
	//   job:    see strider-runner-core for a description of that object
	//   context: currently only defines "dataDir"
	//   cb(err, initializedPlugin)
	init: function (config, job, context, cb) {
		return cb(null, {
			deploy: function (context, done) {
				tasks.save(context, config, job, function(status, message) {
					if (status === tasks.status.SUCCESS) {
						tasks.clean(context, config, job, function(status, message) {
							done(status !== tasks.status.SUCCESS ? message : null, true);
						});
					} else {
						done(message, true);
					}
				});
			}
		});
	}
};
