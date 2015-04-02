# reginabox

[![Build Status](https://travis-ci.org/yahoo/reginabox.svg)](https://travis-ci.org/yahoo/reginabox)

**`reginabox`** (Registry In A Box) is an easy way to set up an npm registry mirror on your local network, and let local network users know about it.

### Installation

`$ npm i -g reginabox`

### Usage

`$ reginabox mirror [outputdir]` will run [registry-static](https://www.npmjs.com/package/registry-static) and a corresponding web server to go along with it. If `outputdir` is provided, it will be used as the output directory, where it stores all the tarballs and metadata. Otherwise, `$PWD/registry` will be used. It will also make the server discoverable via [zeroconf](http://en.wikipedia.org/wiki/Zero-configuration_networking).

`$ reginabox discover` queries the local network for servers that are run using the command above. Once it finds a usable server, it outputs the command to set the registry, and then exits.

### License

See LICENSE.txt
