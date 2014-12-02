'use strict';

// Dependencies.
var fs = require('fs');
var util = require('util');

// Objects.
var Action = require('./action');
var Model = require('../model').Artifact;

module.exports = {
	save: saveTask,
	clean: cleanTask
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
	var packageJson = require(packagePath);
	if (!packageJson.version) {
		return saveAction.done(saveAction.STATUS.ERROR, util.format('Cannot read project version from: %s -> Abort', packageFile));
	}

	var artifact = new Model({
		project: job.project.name,
		job: job._id,
		version: packageJson.version,
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
};

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

		Model.count({project: job.project.name}, function(err, count) {
			if (err) {
				return cleanAction.done(cleanAction.STATUS.ERROR, 'Cannot determine number of artifact to clean -> Abort');
			}
			if (count > config.maxBuilds) {
				Model.find().select('_id').sort({date: 'asc'}).limit(count - config.maxBuilds).exec(function(err, docs) {
					if (err) {
						return cleanAction.done(cleanAction.STATUS.ERROR, 'Cannot retrieve artifacts to clean -> Abort');
					}
					var ids = [];
					for (var doc in docs) {
						ids.push(docs[doc]._id);
					};
					Model.remove({_id: {$in: ids}}, function(err) {
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
};
