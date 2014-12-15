'use strict';

/* jshint -W079: false */
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var fs = require('fs');
var util = require('util');

// Objects
var model = require('../../model').Artifact;
model.prototype.save = sinon.stub();
model.count = sinon.stub();
model.exec = sinon.stub();
model.remove = sinon.stub();
model.find = sinon.stub().returns(model);
model.select = sinon.stub().returns(model);
model.sort = sinon.stub().returns(model);
model.limit = sinon.stub().returns(model);

describe('Tasks module', function() {

	var config = null;
	var context = null;
	var job = null;
	var tasks = null;

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

		model.prototype.save.reset();
		model.count.reset();
		model.exec.reset();
		model.remove.reset();
		model.find.reset();
		model.select.reset();
		model.sort.reset();
		model.limit.reset();

		tasks = new require('../../lib')(model);
	});

	describe('#constructor()', function() {
		it('throws an error if a model is not passed', function() {
			var ex = null;
			try {
				new require('../../lib')();
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist();
		});
		it('exposes 2 functions and a enum', function() {
			expect(tasks).to.have.keys(['save', 'clean', 'status']);
			expect(tasks.save).to.be.a('function');
			expect(tasks.clean).to.be.a('function');
			expect(tasks.status).to.be.a('object');
		});
	});

	describe('#save()', function() {
		var errorMessage = 'My test error message';

		beforeEach(function() {
			model.prototype.save.yields(errorMessage);
		});

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
			it('model.save() method returns an error', function(done) {
				config.fileToSave = 'lib/action.js';
				context.dataDir = '.';

				tasks.save(context, config, job, function(status, message) {
					expect(model.prototype.save.calledOnce).ok;
					expect(status).to.equal(tasks.status.ERROR);
					expect(message).to.exist;
					expect(message).to.equal(util.format('Impossible to save artifact: %s', config.fileToSave));
					done();
				});
			});
		});

		it('saves an artifact based on the given configuration', function(done) {
			model.prototype.save.yields();

			var fileName = 'action.js';
			var packageJson = JSON.parse(fs.readFileSync('./package.json'));

			config.fileToSave = 'lib/' + fileName;
			context.dataDir = '.';

			tasks.save(context, config, job, function(status, message) {
				expect(model.prototype.save.calledOnce).ok;

				var artifact = model.prototype.save.thisValues[0];
				expect(artifact).to.be.a('object');
				expect(artifact.project).to.equal(job.project.name);
				expect(artifact.job).to.equal(job._id);
				expect(artifact.version).to.equal(packageJson.version);
				expect(artifact.date.getTime()).to.equal(new Date(job.created).getTime());
				expect(artifact.artifact).to.be.a('object');
				expect(artifact.artifact.name).to.equal(fileName);

				expect(status).to.equal(tasks.status.SUCCESS);
				expect(message).to.exist;
				expect(message).to.equal(util.format('Artifact %s save succesfully', config.fileToSave));

				done();
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

				model.count.yields(null, config.maxBuilds - 1);

				tasks.clean(context, config, job, function(status, message) {
					expect(status).to.equal(tasks.status.SUCCESS);
					expect(message).to.exist;
					expect(message).to.equal('Nothing to clean');
					done();
				});
			});
		});
		describe('logs an error if', function() {
			var offset = 2;

			beforeEach(function() {
				config.maxBuilds = 5;
			});

			it('MongoDB cannot get the model count', function(done) {
				model.count.yields('Error', config.maxBuilds + offset);

				tasks.clean(context, config, job, function(status, message) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(message).to.exist;
					expect(message).to.equal('Cannot determine number of artifact to clean -> Abort');
					done();
				});
			});
			it('MongoDB cannot get models to remove', function(done) {
				model.count.yields(null, config.maxBuilds + offset);
				model.exec.yields('Error');

				tasks.clean(context, config, job, function(status, message) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(message).to.exist;
					expect(message).to.equal('Cannot retrieve artifacts to clean -> Abort');
					done();
				});
			});
			it('MongoDB cannot remove models', function(done) {
				model.count.yields(null, config.maxBuilds + offset);
				model.exec.yields(null, []);
				model.remove.yields('Error');

				tasks.clean(context, config, job, function(status, message) {
					expect(status).to.equal(tasks.status.ERROR);
					expect(message).to.exist;
					expect(message).to.equal('Cannot remove artifacts to clean -> Abort');
					done();
				});
			});
		});
		it('removes artifacts based on the configuration', function(done) {
			var offset = 2;

			config.maxBuilds = 5;

			var ids = [];
			var inIds = [];
			for (var i = 0; i < offset; i++) {
				ids.push({_id: i});
				inIds.push(i);
			}

			model.count.yields(null, config.maxBuilds + offset);
			model.exec.yields(null, ids);
			model.remove.yields();

			tasks.clean(context, config, job, function(status, message) {
				expect(status).to.equal(tasks.status.SUCCESS);
				expect(message).to.exist;
				expect(message).to.equal('Cleaning succesfully');

				expect(model.limit.calledOnce).ok;
				expect(model.limit.calledWith(offset)).ok;

				expect(model.remove.calledOnce).ok;
				expect(model.remove.calledWith({_id: {$in: inIds}}));

				done();
			});
		});
	});
});
