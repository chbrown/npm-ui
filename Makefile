BIN := node_modules/.bin

all: build/bundle.js site.css img/favicon.ico

img/favicon-%.png: img/logo.psd
	# [0] pulls off the composited layer from the original PSD
	convert $^[0] -resize $*x$* $@
img/favicon.ico: img/favicon-16.png img/favicon-32.png
	convert $^ $@

$(BIN)/tsc $(BIN)/watsh $(BIN)/browserify $(BIN)/watchify $(BIN)/lessc $(BIN)/cleancss:
	npm install

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc

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
