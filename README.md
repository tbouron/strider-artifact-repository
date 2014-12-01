# strider-artifact-repository

Save defined artifacts into MongoDB for each job and project on the deploy phase. Also expose an API to retrieve the artifacts history and download them.

**IMPORTANT: This plugin curently support NodeJs projects only.**

## Setup

On project configuration page, adds the plugin *artifact-repository*, then:
- enter the path of the file to save ***from the root of the project*** (e.g. to save the package.json of a node project, just write *package.json*)
- enter the maximum number of file to keep for this project. If you enter 0, there will be no limit so be careful to the overall size of your MongoDB if you choose this value.

## API

This plugin creates 3 endpoinds, for instance:

- **/:org/:repo/api/artifact-repository/history?branch=:branchName** => returns all artifact info history for a particular project, as a JSON.
- **/:org/:repo/api/artifact-repository/latest?branch=:branchName** => returns the latest artifact info for a particular project, as a JSON.
- **/:org/:repo/api/artifact-repository/dl/:artifactid?branch=:branchName** => downloads a particular artifact.

Endpoints are accessible only for logged users who have access to the specified project. If the user is not already logged in, you can pass the basic authentication header while performing the request.
