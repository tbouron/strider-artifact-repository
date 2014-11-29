strider-artifact-repository
===========================

Save defined artifacts into MongoDB for each job and project on the deploy phase. Also expose an API to retrieve the artifacts history and download them.

### API

The plugin creates 3 endpoinds, for instance:

1. **/:org/:repo/api/artifact-repository/history** => returns all artifact info history for a particular project, as a JSON.

2. **/:org/:repo/api/artifact-repository/latest** => returns the latest artifacts info for a particular project, as a JSON.

3. **/:org/:repo/api/artifact-repository/dl/:artifactid** => downloads a particular artifact.
