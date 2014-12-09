# npm-ui

How does this compare to [npm-www](https://github.com/npm/npm-www), and [newww](https://github.com/npm/newww), which is live at [preview.npmjs.com](https://preview.npmjs.com/)?

Also, [npm2es](https://github.com/solids/npm2es) might be useful? Has CouchDB -> Elasticsearch syncing features.

I'm not sure what compelling reason there is to use [npm-registry-client](https://github.com/npm/npm-registry-client) -- it looks like it's just a wrapper around request with named functions for a few of the registry's endpoints.

The registry API desperately lacks documentation other than the npm source code, but the api API has [better documentation](https://github.com/npm/download-counts).


## development

Start the server like:

    PORT=8700 node_restarter 'node server.js'

A plain `npm start` should work too.


## License

Copyright 2014 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
