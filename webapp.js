'use strict';

var util = require('util');

module.exports = {
	// mongoose models loader
	models: require('./model'),

	// mongoose schema, if you need project-specific config
	config: {
		repository: {
			fileToSave: {type: String},
			maxBuilds: {type: Number, min: 0, default: 20}
		}
	},
	// Define project-specific routes
	//   all routes created here are namespaced within /:org/:repo/api/:pluginid
	//   req.project is the current project
	//   req.accessLevel is the current user's access level for the project
	//	  0 - anonymous, 1 - authed, 2 - admin / collaborator
	//   req.user is the current user
	//   req.pluginConfig() -> get the config for this plugin
	//   req.pluginConfig(config, cb(err)) -> set the config for this plugin
	// -----------------------------------------------------------
	routes: function (app, context) {
		var self = this;
		var Model = self.models.Artifact;

		app.get('history', function(req, res) {
			Model.find({
				project: util.format('%s/%s', req.params.org, req.params.repo)
			}).select('id project job version date')
			.sort({date: 'desc'})
			.lean()
			.exec(function(err, items) {
				if (err) {
					return res.send(400, 'Impossible to get artifacts')
				}
				res.send(200, util.format('{"artifacts": %s}', JSON.stringify(items)));
			});
		});
		app.get('latest', function(req, res) {
			Model.findOne({
				project: util.format('%s/%s', req.params.org, req.params.repo)
			}).select('id project job version date')
			.sort({date: 'desc'})
			.lean()
			.exec(function(err, artifact) {
				if (err) {
					return res.send(400, util.format('No artifact for this project `%s`', req.params.repo));
				}
				res.send(200, util.format('{"latest": %s}', JSON.stringify(artifact)));
			});
		});
		app.get('dl/:artifactid', function(req, res) {
			Model.findOne({
				_id: req.params.artifactid,
				project: util.format('%s/%s', req.params.org, req.params.repo)
			}, 'project version artifact', function(err, artifact) {
				if (err) {
					return res.send(400, util.format('Artifact ID `%s` does not exits', req.params.artifactid));
				}
				res.setHeader('Content-disposition', util.format('attachment; filename=%s', artifact.artifact.name));
				res.setHeader('Content-type', 'application/zip, application/octet-stream');
				res.send(200, artifact.artifact.data);
			});
		});
	}
};
