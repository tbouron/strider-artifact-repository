var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var worker = require('../worker.js');
var tasks = require('../lib');

describe('Worker artifact-repository', function() {
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
	it('calls save() task', function() {
		sinon.stub(tasks, 'save');
		var setup = work();

		setup.deploy();

		expect(tasks.save.calledOnce).ok;
		
		tasks.save.restore();
	});
});
