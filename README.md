blanket-cli
===========

This cli was built to instrument large amounts of javascript files for later
use with [blanket](http://blanketjs.org/) in a webbrowser. By default, it uses
the amount of available cores as the amount of processes to parallelize the
instrumentation of files.

Installation
------------

From npm

	npm install blanket-cli -g

From github/development

	git clone https://github.com/flower-pot/blanket-cli.git
	cd blanket-cli
	npm install
	npm link

Usage
-----

The cli is self documenting you can call the help description when needed.

	$ blanket-cli --help
	
	Usage: cli [options] [target ...]
	
	Instrument javascript code for coverage analysis with blanket.js
	
	Options:
	
	  -h, --help                 output usage information
	  -V, --version              output the version number
	  -R, --recursive            Instrument a directory recursively
	  -s, --separate [dir]       Separate instrumented files in different subdir
	  -d, --debug                Display time used for overall processing. If used in combination with --verbose it display time used for each file to instrument
	  -v, --verbose              Display some information on the current status
	  -q, --quiet                Surpress warnings and log output
	  -p, --parallelism <forks>  Spread work over n parallel processes (defaults to amount of available cpu cores)
	  --cleanup                  Removes all files in the given targets starting with 'instrumented-'
