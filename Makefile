BIN := node_modules/.bin
DTS := lodash/lodash jquery/jquery angularjs/angular angularjs/angular-resource

all: build/bundle.js site.css img/favicon.ico
type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)

img/favicon-%.png: img/logo.psd
	# [0] pulls off the composited layer from the original PSD
	convert $^[0] -resize $*x$* $@
img/favicon.ico: img/favicon-16.png img/favicon-32.png
	convert $^ $@

type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/chbrown/DefinitelyTyped/master/$* > $@

$(BIN)/tsc $(BIN)/watsh $(BIN)/browserify $(BIN)/watchify $(BIN)/lessc $(BIN)/cleancss:
	npm install

%.js: %.ts type_declarations $(BIN)/tsc
	$(BIN)/tsc -m commonjs -t ES5 $<

%.css: %.less $(BIN)/lessc $(BIN)/cleancss
	$(BIN)/lessc $< | $(BIN)/cleancss --keep-line-breaks --skip-advanced -o $@

build/bundle.js: app.js $(BIN)/browserify
	mkdir -p $(@D)
	$(BIN)/browserify $< -o $@

dev: $(BIN)/browserify $(BIN)/watchify $(BIN)/watsh
	(\
   $(BIN)/watsh 'make site.css' site.less & \
   $(BIN)/tsc -m commonjs -t ES5 -w *.ts & \
   $(BIN)/watchify app.js -o build/bundle.js -v & \
   wait)
