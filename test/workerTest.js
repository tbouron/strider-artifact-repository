'use strict';

/* jshint -W079: false */
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var worker = require('../worker.js');
var tasks = new require('../lib')(sinon.stub());

describe('Worker module', function() {
	var work = null;

	beforeEach(function(done) {
		worker.init({}, {}, sinon.stub(), function(err, res) {
			work = function(){
				return res;
			};
			done();
		});
	});
	it('defines only a deploy phase', function() {
		var setup = work();

		expect(setup).to.have.property('deploy');
		expect(setup.deploy).to.be.a('function');
	});
});
