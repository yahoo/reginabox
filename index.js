#!/usr/bin/env node
/*
Copyright (c) 2015, Yahoo! Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt file.
*/
var command = process.argv[2];

if (command === 'mirror') {
    require('./lib/mirror');
} else if (command === 'discover') {
    require('./lib/discover');
} else {
    console.log('reginabox - npm in a box\n');
    console.log('Usage:');
    console.log('\n    $ reginabox mirror [<outputdir>]');
    console.log('    # runs the mirror, storing files in outputdir (default: $PWD/registry)');
    console.log('\n    $ reginabox discover');
    console.log('    # find reginabox mirrors on the local network');
}
