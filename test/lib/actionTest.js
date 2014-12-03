var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var Action = require('../../lib/action');

describe('Action class', function() {
	describe('#constructor()', function() {
		it('returns new object event if new is not used', function() {
			var functionAction = Action('My Test action as function', sinon.stub(), sinon.stub());
			var objectAction = new Action('My Test action as object', sinon.stub(), sinon.stub());

			expect(functionAction).to.be.a('object');
			expect(functionAction).to.be.a('object');
		});
		it('throws an error if the name is null/undefined/empty', function() {
			var names = [undefined, null, ''];

			for (var i in names) {
				var ex = null;
				try {
					new Action(names[i], sinon.stub(), sinon.stub());
				} catch (e) {
					ex = e;
				}
				expect(ex).to.exist();
			}
		});
	});

	describe('#start()', function() {
		var context = {};
		var testAction = null;

		beforeEach(function() {
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
			testAction = new Action('My Test action as object', context, sinon.stub());
		});
		it('returns itself for chaining', function() {
			expect(testAction.start()).to.equal(testAction);
		});
		it('calls context.status() once with correct parameters', function() {
			testAction.start()

			var args = context.status.args[0];

			expect(context.status.calledOnce).ok;
			expect(args[0]).to.equal('command.start');
			expect(args[1]).to.have.property('command', 'My Test action as object');
			expect(args[1]).to.have.property('time').that.is.an('date');
			expect(args[1]).to.have.property('plugin', context.plugin);
		});
	});

	describe('#done()', function() {
		var context = {};
		var callback = null;
		var testAction = null;

		beforeEach(function() {
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
			callback = sinon.stub();
			testAction = new Action('My Test action as object', context, callback);
		});
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				testAction.done(testAction.STATUS.SUCCESS, 'A done message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist();
		});
		describe('logs', function() {
			beforeEach(function() {
				testAction.start();
			});
			it('an log message if status === STATUS.SUCCESS', function() {
				var message = 'A done message for success';
				testAction.done(testAction.STATUS.SUCCESS, message);

				expect(context.logger.log.called).ok;
				expect(context.logger.log.calledWithExactly(message));
				expect(context.out.called).ok
				expect(context.out.calledWithExactly(message, 'log')).ok;
			});
			it('an warn message if status === STATUS.WARNING', function() {
				var message = 'A done message for warning';
				testAction.done(testAction.STATUS.WARNING, message);

				expect(context.logger.warn.called).ok;
				expect(context.logger.warn.calledWithExactly(message));
				expect(context.out.called).ok
				expect(context.out.calledWithExactly(message, 'log')).ok;
			});
			it('an error message if status === STATUS.ERROR', function() {
				var message = 'A done message for error';
				testAction.done(testAction.STATUS.ERROR, message);

				expect(context.logger.error.called).ok;
				expect(context.logger.error.calledWithExactly(message));
				expect(context.out.called).ok
				expect(context.out.calledWithExactly(message, 'error')).ok;
			});
			it('nothing if message is undefined/null/empty', function() {
				var messages = [undefined, null, ''];

				for (var i in messages) {
					if (i > 0) {
						testAction.start();
					}
					testAction.done(testAction.STATUS.SUCCESS, messages[i]);

					expect(context.logger.log.called).not.ok;
				}
			});
		});
		it('calls context.status() with correct parameters', function() {
			testAction.start().done(testAction.STATUS.SUCCESS, '');

			var args = context.status.lastCall.args;

			expect(context.status.called).ok;
			expect(args[0]).to.equal('command.done');
			expect(args[1]).to.have.property('exitCode', testAction.STATUS.SUCCESS);
			expect(args[1]).to.have.property('time').that.is.an('date');
			expect(args[1]).to.have.property('elapsed').that.is.an('number');
		});
		it('calls the callback() with correct parameters', function() {
			var message = 'My done message';
			testAction.start().done(testAction.STATUS.SUCCESS, message);

			expect(callback.calledOnce).ok
			expect(callback.calledWithExactly(testAction.STATUS.SUCCESS, message));
		});
	});

	describe('#log()', function() {
		var context = {};
		var testAction = null;

		beforeEach(function() {
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
			testAction = new Action('My Test action as object', context, sinon.stub());
		});
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				testAction.log('A log message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist();
		});
		it('returns itself for chaining', function() {
			var message = 'A log message';
			var res = testAction.start().log(message);

			expect(res).to.equal(testAction);
		});
		it('calls context.logger.log() and context.out() with correct parameters', function() {
			var message = 'A log message';
			testAction.start().log(message);

			expect(context.logger.log.calledOnce).ok;
			expect(context.logger.log.calledWithExactly(message));
			expect(context.out.calledOnce).ok
			expect(context.out.calledWithExactly(message, 'log')).ok;
		})
	});

	describe('#warn()', function() {
		var context = {};
		var testAction = null;

		beforeEach(function() {
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
			testAction = new Action('My Test action as object', context, sinon.stub());
		});
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				testAction.warn('A warn message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist();
		});
		it('returns itself for chaining', function() {
			var message = 'A warn message';
			var res = testAction.start().warn(message);

			expect(res).to.equal(testAction);
		});
		it('calls context.logger.warn() and context.out() with correct parameters', function() {
			var message = 'A warn message';
			testAction.start().warn(message);

			expect(context.logger.warn.calledOnce).ok;
			expect(context.logger.warn.calledWithExactly(message));
			expect(context.out.calledOnce).ok
			expect(context.out.calledWithExactly(message, 'log')).ok;
		})
	});

	describe('#error()', function() {
		var context = {};
		var testAction = null;

		beforeEach(function() {
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
			testAction = new Action('My Test action as object', context, sinon.stub());
		});
		it('throws an error if the start() was not invoked', function() {
			var ex = null;
			try {
				testAction.error('An error message');
			} catch (e) {
				ex = e;
			}
			expect(ex).to.exist();
		});
		it('returns itself for chaining', function() {
			var message = 'An error message';
			var res = testAction.start().error(message);

			expect(res).to.equal(testAction);
		});
		it('calls context.logger.error() and context.out() with correct parameters', function() {
			var message = 'A log message';
			testAction.start().error(message);

			expect(context.logger.error.calledOnce).ok;
			expect(context.logger.error.calledWithExactly(message));
			expect(context.out.calledOnce).ok
			expect(context.out.calledWithExactly(message, 'error')).ok;
		})
	});
});
