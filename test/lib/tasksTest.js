'use strict';

/* jshint -W079: false */
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var util = require('util');
var tasks = require('../../lib');

describe('Task module', function() {

	it('exposes 2 functions', function() {
		expect(tasks).to.have.keys(['save', 'clean']);
		expect(tasks.save).to.be.a('function');
		expect(tasks.clean).to.be.a('function');
	});

	describe('#saveTask()', function() {
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

		describe('logs an error if', function() {
			it('fileToSave config parameter is missing', function(done) {
				tasks.save(context, config, job, function(err) {
					expect(err).to.exist;
					expect(err).to.equal('No file to save. Please verify your project configuration -> Abort');
					done();
				});
			});
			it('file defined by fileToSave config parameter, is missing', function(done) {
				config.fileToSave = 'my-file-to-save.zip';

				tasks.save(context, config, job, function(err) {
					expect(err).to.exist;
					expect(err).to.equal(util.format('The file to save: %s does not exist -> Abort', config.fileToSave));
					done();
				});
			});
			it('file package.json of the build node project is missing', function(done) {
				config.fileToSave = 'index.js';
				context.dataDir = './lib';

				tasks.save(context, config, job, function(err) {
					expect(err).to.exist;
					expect(err).to.equal(util.format('The package.json file does not exist within the project %s -> Abort', job.project.name));
					done();
				});
			});
			it('version within package.json is missing', function(done) {
				config.fileToSave = 'package.json';
				context.dataDir = './test/fixture';

				tasks.save(context, config, job, function(err) {
					expect(err).to.exist;
					expect(err).to.equal(util.format('Cannot read project version from: %s -> Abort', 'package.json'));
					done();
				});
			});
		});
	});
});
