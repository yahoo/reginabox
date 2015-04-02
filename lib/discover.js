/*
Copyright (c) 2015, Yahoo! Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt file.
*/
var mdns = require('mdns');
var http = require('http');

var found = {};

var log = global.log || console.log;

log('Searching...');
mdns.createBrowser(mdns.tcp('reginabox')).on('serviceUp', function(service){
    service.addresses.forEach(function(host){
        var req = http.get({host: host, port: service.port, path: '/'}, function(res) {
            if (res.statusCode !== 200 || res.headers.server !== 'reginabox') {
                return;
            }
            res.setEncoding('utf8');
            var result = '';
            res.on('data', function(data){
                result += data;
            });
            res.on('end', function(){
                try {
                    result = JSON.parse(result);
                    if (result.sequence && result.latestSeq) {
                        found['http://'+host+':'+service.port] = 100 - Math.floor(100*(result.latestSeq - result.sequence)/result.latestSeq);
                    }
                } catch(e) {
                    // ignore it
                }
            });
        }).on('error', function(){
            // ignore it
        }).on('socket', function (socket) {
            socket.setTimeout(500);
            socket.on('timeout', function() {
                req.abort();
            });
        });
    });
}).start();


setTimeout(function(){
    if (!Object.keys(found).length) {
        log('Couldn\'t find any reginabox registries!');
        return process.exit(1);
    }

    log('Found registr'+(Object.keys(found).length === 1 ? 'y' : 'ies')+'!');
    Object.keys(found).forEach(function(registry){
        log('');
        log(registry);
        log(' --> Freshness:', found[registry]+'%');
    });
    log('\n\nTo use a registry, for a given URL, do the following:');
    log('  $ npm config set registry URL');
    process.exit(0);
}, 1000); // should be able to find something in a second!
