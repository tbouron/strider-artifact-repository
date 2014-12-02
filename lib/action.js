'use strict';

module.exports = action;

function action(name, context, callback) {
	if (!(this instanceof action)) {
		return new action(name, context, callback);
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
		this.start = new Date();
		this.context.status('command.start', {command: this.name, time: this.start, plugin: this.context.plugin});
		return this;
	},

	done: function(status, message) {
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
		this.end = new Date();
		this.context.status('command.done', {exitCode: status, time: this.end, elapsed: this.end.getTime() - this.start.getTime()});

		if (this.callback) {
			this.callback(status, message);
		}
	},

	log: function(message) {
		this.context.logger.log(message);
		this.context.out(message, 'log');
		return this;
	},

	warn: function(message) {
		this.context.logger.warn(message);
		this.context.out(message, 'log');
		return this;
	},

	error: function(message) {
		this.context.logger.error(message);
		this.context.out(message, 'error');
		return this;
	}
};
