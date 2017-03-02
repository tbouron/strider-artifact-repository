'use strict';

module.exports = action;

function action(name, context, callback) {
	/* jshint validthis: true */
	if (!(this instanceof action)) {
		return new action(name, context, callback);
	}
	if (!name || 0 === name.length) {
		throw new Error('Action name must not be empty');
	}
	this.name = name;
	this.context = context;
	this.callback = callback;
}

action.prototype = {
	STATUS: {
		SUCCESS: 0,
		ERROR: 1,
		WARNING: 2
	},

	start: function() {
		this.startDate = new Date();
		this.context.status('command.start', {command: this.name, time: this.startDate, plugin: this.context.plugin});
		return this;
	},

	done: function(status, message) {
		if (!this.startDate) {
			throw new Error('Cannot finish the action as start() method was not invoked');
		}

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
		this.endDate = new Date();
		this.context.status('command.done', {exitCode: status, time: this.endDate, elapsed: this.endDate.getTime() - this.startDate.getTime()});

		this.startDate = null;

		if (this.callback) {
			this.callback(status, message);
		}
	},

	log: function(message) {
		if (!this.startDate) {
			throw new Error('Cannot log the message as start() method was not invoked');
		}

		console.log(message);
		this.context.out(message, 'log');
		return this;
	},

	warn: function(message) {
		if (!this.startDate) {
			throw new Error('Cannot log the message as start() method was not invoked');
		}

		console.warn(message);
		this.context.out(message, 'log');
		return this;
	},

	error: function(message) {
		if (!this.startDate) {
			throw new Error('Cannot log the message as start() method was not invoked');
		}

		console.error(message);
		this.context.out(message, 'error');
		return this;
	}
};
