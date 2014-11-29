var fs = require('fs');
var util = require('util');
var model = require('./model')('artifact');

var success = function(message, start, context, done) {
	var end = new Date();
	context.logger.log(message);
	context.status('command.done', {exitCode: 0, time: end, elapsed: end.getTime() - start.getTime()});
	return done(null, true);
};
var error = function(message, start, context, done) {
	var end = new Date();
	context.logger.error(message);
	context.status('command.done', {exitCode: -1, time: end, elapsed: end.getTime() - start.getTime()});
	return done(message, true);
};

var saveToDb = function(context, config, job, done) {
	console.log(context.__proto__);


	var start = new Date();
	context.status('command.start', { command: 'Save artifact to repository', time: start, plugin: context.plugin });

	if (!config.fileToSave) {
		return error('No file to save. Please verify your project configuration -> Skip', start, context, done);
	}
	var filePath = context.dataDir + '/' + config.fileToSave;
	if (!fs.existsSync(filePath)) {
		return error(util.format('The file to save: %s does not exist -> Abort', filePath), start, context, done);
	}
	var file = fs.readFileSync(filePath);

	var packagePath = context.dataDir + '/package.json';
	if (!fs.existsSync(packagePath)) {
		return error(util.format('The package.json file does not exists within the project %s -> Abort', job.project.name), start, context, done);
	}
	var package = require(packagePath);
	if (!package.version) {
		return error(util.format('Cannot read project version from: %s -> Abort', filePath), start, context, done);
	}

	// Save the new artifact
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
	artifact.save(function (err) {
		if (err) {
			return error(util.format('Impossible to save artifact: %s', filePath), start, context, done);
		} else {
			return success(util.format('Artifact %s save succesfully', filePath), start, context, done);
		}
	});
};

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
				saveToDb(context, config, job, done);
			}
		});
	}
};
