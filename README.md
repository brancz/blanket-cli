blanket-cli
===========

This cli was built to instrument large amounts of javascript files for later
use with [blanket](http://blanketjs.org/) in a webbrowser. By default, it uses
the amount of available cores as the amount of processes to parallelize the
instrumentation of files.

Installation
------------

From github/development

	git clone https://github.com/flower-pot/blanket-cli.git
	cd blanket-cli
	npm install
	npm link

Usage
-----

A common use case is to instrument all files in a directory and its
subdirectories. This can be done with the following command. (assuming the
directory is called `scripts`)

	blanket-cli -r scripts

This command however saves all instrumented files with the prefix
`instrumented-`. The prefix can be overridden with the `--prefix` flag e.g.:

	blanket-cli -r --prefix "other-prefix-" scripts

You might want to put the instrumented scripts in a different directory than
its origin. To accomplish that, use the `-s [dir]` flag. By default it does not
use a prefix, only if you explicitly set one.

	blanket-cli -r -s instrumented-scripts scripts

If you want to know more about the usage refer to the help text.

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
	  --prefix [prefix]          The prefix to use to indicate a file is instrumented (by default "instrumented-" or empty when run with -s flag)
	  --cleanup                  Removes all files in the given targets starting with 'instrumented-'
