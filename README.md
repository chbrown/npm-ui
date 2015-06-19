# npm-ui

`npm-ui` integrates download counts and other metadata (soon) with the NPM registry.

Sometimes the rich get richer because they should, and knowing who's who will save you time.


# Components

- **npm-history**.
  [github](https://github.com/chbrown/npm-history).
  [npm](https://www.npmjs.com/package/npm-history).
  Caching layer on top of [npm, Inc.](https://www.npmjs.com/about)'s [download-counts](https://github.com/npm/download-counts) API, since the download counts data are not available _en masse_.
  + HTTP API
  + Requires PostgreSQL server available at `localhost:5432`
- **npm-downloads-data**.
  [github](https://github.com/chbrown/npm-downloads-data).
  Populated with aggregates of data collected by [npm-history](https://github.com/chbrown/npm-history).
  + Can use GitHub Pages
    * E.g., https://chbrown.github.io/npm-downloads-data/2015/04/averages.json
  + Or [RawGit](https://rawgit.com/)'s generous MaxCDN proxy, which is way faster
    * E.g., https://cdn.rawgit.com/chbrown/npm-downloads-data/gh-pages/2015/04/averages.json
- **npm-search-server**.
  [github](https://github.com/chbrown/npm-search-server). [npm](https://www.npmjs.com/package/npm-search-server). [Docker Hub](https://registry.hub.docker.com/u/chbrown/npm-search-server/).
  + HTTP API
  + Requires ElasticSearch server, Dockerized
  + Needs plenty of memory (at least, ES does)
  + Primed by pulling data from [npm-downloads-data](https://github.com/chbrown/npm-downloads-data)
- [npm-ui](https://github.com/chbrown/npm-ui). User interface for consuming the `search-server` API.
  + Served as gh-pages at [chbrown.github.io/npm-ui/](http://chbrown.github.io/npm-ui/)


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
