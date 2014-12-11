# npm-ui

How does this compare to [npm-www](https://github.com/npm/npm-www), and [newww](https://github.com/npm/newww), which is live at <del>[preview.npmjs.com](https://preview.npmjs.com/)</del>? **New!** Turns out the new site was [deployed](https://www.npmjs.com/) on 2014-12-09, the same day I pushed this repository's code up to GitHub! Still, the new site doesn't let you sort or anything, so it's not much more useful, but it does look nicer than the old site.

Also, [npm2es](https://github.com/solids/npm2es) might be useful? Has CouchDB -> Elasticsearch syncing features.

I'm not sure what compelling reason there is to use [npm-registry-client](https://github.com/npm/npm-registry-client) -- it looks like it's just a wrapper around request with named functions for a few of the registry's endpoints.

The registry API desperately lacks documentation other than the npm source code, but the api API has [better documentation](https://github.com/npm/download-counts).


## Development

Start the server like:

    PORT=8700 node_restarter 'node server.js'

A plain `npm start` should work too.


## Environment

The app expects an Elasticsearch server reachable at `elasticsearch:9200`.
It also expects a GitHub API token in an environment variable called `GITHUB_TOKEN`.


## packages from `https://registry.npmjs.org/-/all` have the following interface:

    interface Package {
      name: string
      // name is the only required field; all the others may be omitted
      time?: {modified: Date}
      author?: {name: string, email: string, url: string}
             | {name: string, email: string}
             | {name: string}
      ...
    }


## License

Copyright 2014 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
