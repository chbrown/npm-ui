all: static/lib.min.js static/lib.max.js static/site.css static/favicon.ico

%.css: %.less
	lessc $+ | cleancss --keep-line-breaks --skip-advanced -o $@

# Use | (order-only prerequisites) to skip existing files
static/lib/%.min.js: | static/lib/%.js
	ng-annotate -a $| | closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET > $@

SCRIPTS = angular angular-resource angular-ui-router ngStorage \
	angular-plugins lodash textarea cookies
static/lib.min.js: $(SCRIPTS:%=static/lib/%.min.js)
	closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET --js $+ > $@
static/lib.max.js: $(SCRIPTS:%=static/lib/%.js)
	cat $+ > $@

static/favicon-32.png: static/favicon-original.png
	convert $+ -resize 32x32 $@.tmp
	pngcrush $@.tmp $@
	rm $@.tmp

static/favicon-16.png: static/favicon-original.png
	convert $+ -resize 16x16 $@.tmp
	pngcrush $@.tmp $@
	rm $@.tmp

static/favicon.ico: static/favicon-16.png static/favicon-32.png
	convert $+ $@
