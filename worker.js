// Dependencies
var fs = require('fs');
var util = require('util');
var model = require('./model')('artifact');

// Helper class for the tasks
function Action(name, context, callback) {
	this.name = name;
	this.context = context;
	this.callback = callback;
};
Action.prototype = {
	STATUS: {
		SUCCESS: 0,
		ERROR: 1,
		WARNING: 2
	},

	start: function() {
		this.start = new Date();
		this.context.status('command.start', {command: this.name, time: this.start, plugin: this.context.plugin});
		return this;
	},

	done: function(status, message) {
		if (message) {
			switch (status) {
				case this.STATUS.SUCCESS:
					this.log(message);
					break;
				case this.STATUS.WARNING:
					this.warn(message);
					break;
				case this.STATUS.ERROR:
					this.error(message);
					break;
			}
		}
		this.end = new Date();
		this.context.status('command.done', {exitCode: status, time: this.end, elapsed: this.end.getTime() - this.start.getTime()});

		if (this.callback) {
			this.callback(status, message);
		}
	},

	log: function(message) {
		this.context.logger.log(message);
		this.context.out(message, 'log');
		return this;
	},

	warn: function(message) {
		this.context.logger.warn(message);
		this.context.out(message, 'log');
		return this;
	},

	error: function(message) {
		this.context.logger.error(message);
		this.context.out(message, 'error');
		return this;
	}
};

// Save the newly generated artifact into MongoDB
function saveTask(context, config, job, done) {
	// Register action.
	var saveAction = new Action('Save artifact to repository', context, function(status, message) {
		if (status === saveAction.STATUS.SUCCESS) {
			cleanTask(context, config, job, done);
		} else {
			done(message, true);
		}
	});

	// Start the save action.
	saveAction.start();

	// Check if there is a file to save within the configuration.
	if (!config.fileToSave) {
		return saveAction.done(saveAction.STATUS.ERROR, 'No file to save. Please verify your project configuration -> Abort');
	}
	// Check if the file exists.
	var filePath = context.dataDir + '/' + config.fileToSave;
	if (!fs.existsSync(filePath)) {
		return saveAction.done(saveAction.STATUS.ERROR, util.format('The file to save: %s does not exist -> Abort', config.fileToSave));
	}
	var file = fs.readFileSync(filePath);
	// Check the version of the project.
	// TODO: Need to modify this to support other types of project.
	var packageFile = 'package.json';
	var packagePath = context.dataDir + '/' + packageFile;
	if (!fs.existsSync(packagePath)) {
		return saveAction.done(saveAction.STATUS.ERROR, util.format('The package.json file does not exist within the project %s -> Abort', job.project.name));
	}
	var package = require(packagePath);
	if (!package.version) {
		return saveAction.done(saveAction.STATUS.ERROR, util.format('Cannot read project version from: %s -> Abort', packageFile));
	}

	var artifact = new model({
		project: job.project.name,
		job: job._id,
		version: package.version,
		date: new Date(job.created),
		artifact: {
			name: config.fileToSave.split('/').pop(),
			data: file
		}
	});

	// Save the new artifact
	artifact.save(function (err) {
		if (err) {
			return saveAction.done(saveAction.STATUS.ERROR, util.format('Impossible to save artifact: %s', config.fileToSave));
		}
		saveAction.done(saveAction.STATUS.SUCCESS, util.format('Artifact %s save succesfully', config.fileToSave));
	});
}

// Clean old artifacts, as per as the configuration.
function cleanTask(context, config, job, done) {
	// Register action.
	var cleanAction = new Action('Clean old artifacts', context, function(status, message) {
		done(status != cleanAction.STATUS.SUCCESS ? message : null, true);
	});

	// Remove old artifacts, if we have to.
	if (config.maxBuilds > 0) {
		// Start the clean action.
		cleanAction.start();

		model.count({project: job.project.name}, function(err, count) {
			if (err) {
				return cleanAction.done(cleanAction.STATUS.ERROR, 'Cannot determine number of artifact to clean -> Abort');
			}
			if (count > config.maxBuilds) {
				model.find().select('_id').sort({date: 'asc'}).limit(count - config.maxBuilds).exec(function(err, docs) {
					if (err) {
						return cleanAction.done(cleanAction.STATUS.ERROR, 'Cannot retrieve artifacts to clean -> Abort');
					}
					var ids = [];
					for (var doc in docs) {
						ids.push(docs[doc]._id);
					}
					console.log(ids);
					model.remove({_id: {$in: ids}}, function(err) {
						if (err) {
							return cleanAction.done(cleanAction.STATUS.ERROR, 'Cannot remove artifacts to clean -> Abort');
						}
						return cleanAction.done(cleanAction.STATUS.SUCCESS, 'Cleaning succesfully');
					});
				});
			} else {
				return cleanAction.done(cleanAction.STATUS.SUCCESS, 'Nothing to clean');
			}
		});
	} else {
		done(null, true);
	}
}

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
				saveTask(context, config, job, done);
			}
		});
	}
};
