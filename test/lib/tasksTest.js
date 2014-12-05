'use strict';

/* jshint -W079: false */
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var fs = require('fs');
var util = require('util');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');

mockgoose(mongoose);

var tasks = require('../../lib');
var models = require('../../model');

describe('Task module', function() {
	var config = null,
		context = null,
		job = null;

	beforeEach(function() {
		config = {};
		context = {
			plugin: 'my-test-plugin',
			status: sinon.stub(),
			out: sinon.stub(),
			logger: {
				log: sinon.stub(),
				warn: sinon.stub(),
				error: sinon.stub()
			}
		};
		job = {
			project: {
				name: 'my-username/my-plugin'
			},
			_id: 'sdf43265uysergrdeg5423',
			created: new Date().getTime()
		};
	});
	afterEach(function() {
		mockgoose.reset();
	});

	it('exposes 2 functions', function() {
		expect(tasks).to.have.keys(['save', 'clean', 'status']);
		expect(tasks.save).to.be.a('function');
		expect(tasks.clean).to.be.a('function');
		expect(tasks.status).to.be.a('object');
	});

	describe('#save()', function() {
		describe('logs an error if', function() {
			it('fileToSave config parameter is missing', function(done) {
				tasks.save(context, config, job, function(status, err) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(err).to.exist;
					expect(err).to.equal('No file to save. Please verify your project configuration -> Abort');
					done();
				});
			});
			it('file defined by fileToSave config parameter, is missing', function(done) {
				config.fileToSave = 'my-file-to-save.zip';

				tasks.save(context, config, job, function(status, err) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(err).to.exist;
					expect(err).to.equal(util.format('The file to save: %s does not exist -> Abort', config.fileToSave));
					done();
				});
			});
			it('file package.json of the build node project is missing', function(done) {
				config.fileToSave = 'index.js';
				context.dataDir = './lib';

				tasks.save(context, config, job, function(status, err) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(err).to.exist;
					expect(err).to.equal(util.format('The package.json file does not exist within the project %s -> Abort', job.project.name));
					done();
				});
			});
			it('version within package.json is missing', function(done) {
				config.fileToSave = 'package.json';
				context.dataDir = './test/fixture';

				tasks.save(context, config, job, function(status, err) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(err).to.exist;
					expect(err).to.equal(util.format('Cannot read project version from: %s -> Abort', 'package.json'));
					done();
				});
			});
		});

		describe('otherwise', function() {
			var fileName = 'action.js';
			var packageJson = JSON.parse(fs.readFileSync('./package.json'));

			beforeEach(function() {
				config.fileToSave = 'lib/' + fileName;
				context.dataDir = '.';
			});

			it('it saved a new artifact, based on given parameters', function(done) {
				tasks.save(context, config, job, function(status, message) {
					models.Artifact.find(function(err, docs) {
						if (err) {
							done(err);
						}
						expect(docs.length).to.equal(1);
						var artifact = docs[0];
						expect(artifact).to.be.a('object');
						expect(artifact.project).to.equal(job.project.name);
						expect(artifact.job).to.equal(job._id);
						expect(artifact.version).to.equal(packageJson.version);
						expect(artifact.date.getTime()).to.equal(new Date(job.created).getTime());
						expect(artifact.artifact).to.be.a('object');
						expect(artifact.artifact.name).to.equal(fileName);
						done();
					});
				});
			});
		});
	});
	describe('#clean()', function() {
		describe('does nothing if', function() {
			it('maxBuilds configuration parameter is missing or set to 0', function(done) {
				config.maxBuilds = 0;
				tasks.clean(context, config, job, function(status, message) {
					expect(status).to.equal(tasks.status.SUCCESS);
					expect(message).to.not.exist;
					done();
				});
			});
			it('number of saved artifacts is less than maxBuilds configuration parameter', function(done) {
				config.maxBuilds = 5;

				var artifacts = [];
				for (var i = 0; i < config.maxBuild - 1; i++) {
					artifacts.push({
						project: job.project.name,
						job: job._id,
						version: i,
						date: new Date(job.created),
						artifact: {
							name: config.fileToSave.split('/').pop(),
							data: null
						}
					});
				}

				models.Artifact.create(artifacts, function(err, results) {
					if (err) {
						done(err);
					}
					tasks.clean(context, config, job, function(status, message) {
						expect(status).to.equal(tasks.status.SUCCESS);
						expect(message).to.exist;
						expect(message).to.equal('Nothing to clean');
						done();
					});
				});
			});
		});

		/*
		it('removes the excess if number of saved artifacts is greater than maxBuilds configuration parameter', function(done) {
			config.maxBuilds = 5;

			var offset = 2;
			var artifacts = [];
			for (var i = 0; i < config.maxBuild + offset; i++) {
				artifacts.push({
					project: job.project.name,
					job: job._id,
					version: i,
					date: new Date(job.created),
					artifact: {
						name: config.fileToSave.split('/').pop(),
						data: null
					}
				});
			}

			models.Artifact.create(artifacts, function(err, results) {
				if (err) {
					done(err);
				}
				tasks.clean(context, config, job, function(status, message) {
					expect(status).to.equal(tasks.status.SUCCESS);
					expect(message).to.exist;
					expect(message).to.equal('Cleaning succesfully');
					models.Artifact.find(function(err, docs) {
						if (err) {
							done(err);
						}
						expect(docs.length).to.equal(config.maxBuilds);
						done();
					});
				});
			});
		});
		*/
	});
});
