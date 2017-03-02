'use strict';

/* jshint -W079: false */
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var Action = require('../../lib/action');

describe('Action module', function() {
	var context = {
		plugin: 'my-test-plugin',
		status: sinon.stub(),
		out: sinon.stub()
	};
	var callback = sinon.stub();
	var action = null;

	sinon.spy(console, 'log');
	sinon.spy(console, 'warn');
	sinon.spy(console, 'error');

	beforeEach(function() {
		context.status.reset();
		context.out.reset();
		console.log.reset();
		console.warn.reset();
		console.error.reset();
		callback.reset();
		action = new Action('My Test action', context, callback);
	});

	describe('#constructor()', function() {
		it('returns new object event if new is not used', function() {
			/* jshint newcap: false */
			var functionAction = Action('My Test action as function', sinon.stub(), sinon.stub());
			var objectAction = new Action('My Test action as object', sinon.stub(), sinon.stub());

			expect(functionAction).to.be.a('object');
			expect(objectAction).to.be.a('object');
		});
		it('throws an error if the name is null/undefined/empty', function() {
			var names = [undefined, null, ''];

			for (var i in names) {
				var ex = null;
				try {
					var obj = new Action(names[i], sinon.stub(), sinon.stub());
				} catch (e) {
					ex = e;
				}
				expect(ex).to.exist;
			}
		});
	});

	describe('#start()', function() {
		it('returns itself for chaining', function() {
			expect(action.start()).to.equal(action);
		});
		it('calls context.status() once with correct parameters', function() {
			action.start()

			var args = context.status.args[0];

			expect(context.status.calledOnce).ok;
			expect(args[0]).to.equal('command.start');
			expect(args[1]).to.have.property('command', 'My Test action');
			expect(args[1]).to.have.property('time').that.is.an('date');
			expect(args[1]).to.have.property('plugin', context.plugin);
		});
	});

	describe('#done()', function() {
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				action.done(action.STATUS.SUCCESS, 'A done message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist;
		});
		describe('logs', function() {
			beforeEach(function() {
				action.start();
			});
			it('an log message if status === STATUS.SUCCESS', function() {
				var message = 'A done message for success';
				action.done(action.STATUS.SUCCESS, message);

				expect(console.log.called).ok;
				expect(console.log.calledWithExactly(message));
				expect(context.out.called).ok
				expect(context.out.calledWithExactly(message, 'log')).ok;
			});
			it('an warn message if status === STATUS.WARNING', function() {
				var message = 'A done message for warning';
				action.done(action.STATUS.WARNING, message);

				expect(console.warn.called).ok;
				expect(console.warn.calledWithExactly(message));
				expect(context.out.called).ok
				expect(context.out.calledWithExactly(message, 'log')).ok;
			});
			it('an error message if status === STATUS.ERROR', function() {
				var message = 'A done message for error';
				action.done(action.STATUS.ERROR, message);

				expect(console.error.called).ok;
				expect(console.error.calledWithExactly(message));
				expect(context.out.called).ok
				expect(context.out.calledWithExactly(message, 'error')).ok;
			});
			it('nothing if message is undefined/null/empty', function() {
				var messages = [undefined, null, ''];

				for (var i in messages) {
					if (i > 0) {
						action.start();
					}
					action.done(action.STATUS.SUCCESS, messages[i]);

					expect(console.log.called).not.ok;
				}
			});
		});
		it('calls context.status() with correct parameters', function() {
			action.start().done(action.STATUS.SUCCESS, '');

			var args = context.status.lastCall.args;

			expect(context.status.called).ok;
			expect(args[0]).to.equal('command.done');
			expect(args[1]).to.have.property('exitCode', action.STATUS.SUCCESS);
			expect(args[1]).to.have.property('time').that.is.an('date');
			expect(args[1]).to.have.property('elapsed').that.is.an('number');
		});
		it('calls the callback() with correct parameters', function() {
			var message = 'My done message';
			action.start().done(action.STATUS.SUCCESS, message);

			expect(callback.calledOnce).ok
			expect(callback.calledWithExactly(action.STATUS.SUCCESS, message));
		});
	});

	describe('#log()', function() {
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				action.log('A log message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist;
		});
		it('returns itself for chaining', function() {
			var message = 'A log message';
			var res = action.start().log(message);

			expect(res).to.equal(action);
		});
		it('calls context.logger.log() and context.out() with correct parameters', function() {
			var message = 'A log message';
			action.start().log(message);

			expect(console.log.calledOnce).ok;
			expect(console.log.calledWithExactly(message));
			expect(context.out.calledOnce).ok
			expect(context.out.calledWithExactly(message, 'log')).ok;
		})
	});

	describe('#warn()', function() {
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				action.warn('A warn message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist;
		});
		it('returns itself for chaining', function() {
			var message = 'A warn message';
			var res = action.start().warn(message);

			expect(res).to.equal(action);
		});
		it('calls context.logger.warn() and context.out() with correct parameters', function() {
			var message = 'A warn message';
			action.start().warn(message);

			expect(console.warn.calledOnce).ok;
			expect(console.warn.calledWithExactly(message));
			expect(context.out.calledOnce).ok
			expect(context.out.calledWithExactly(message, 'log')).ok;
		})
	});

	describe('#error()', function() {
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				action.error('An error message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist;
		});
		it('returns itself for chaining', function() {
			var message = 'An error message';
			var res = action.start().error(message);

			expect(res).to.equal(action);
		});
		it('calls context.logger.error() and context.out() with correct parameters', function() {
			var message = 'A log message';
			action.start().error(message);

			expect(console.error.calledOnce).ok;
			expect(console.error.calledWithExactly(message));
			expect(context.out.calledOnce).ok
			expect(context.out.calledWithExactly(message, 'error')).ok;
		})
	});
});
