/*
Copyright (c) 2015, Yahoo! Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt file.
*/
var express = require('express');
var st = require('st');
var lru = require('lru-cache');
var fs = require('fs');
var url = require('url');
var mdns = require('mdns');
var path = require('path');
var spawn = require('child_process').spawn;
var logger = require('davlog');
logger.init({name: 'reginabox'});

var app = express();
var cache = lru();
var port;

var outputDir = process.argv[3] || path.join(process.cwd(), 'registry');
logger.info('using output directory', outputDir);

// log each request, set server header
app.use(function(req, res, cb){
    logger.info(req.ip, req.method, req.path);
    res.append('Server', 'reginabox');
    cb();
});

// serve up main index (no caching)
app.get('/', function(req, res){
    res.type('json');
    fs.createReadStream(path.join(outputDir, 'index.json')).pipe(res);
});

// serve up tarballs
app.use(st({path: outputDir, passthrough: true, index: false}));

// serve up metadata. doing it manually so we can modify JSON
app.use(function(req, res){
    var cached = cache.get(req.url);
    if (cached) {
        res.type('json')
        res.send(cached);
        return;
    }

    fs.readFile(path.join(outputDir, req.url, 'index.json'), {encoding: 'utf8'}, function(err, data){
        if (err) {
            res.sendStatus(err.code === 'ENOENT' ? 404 : 500);
            return;
        }

        data = JSON.parse(data);
        if (data && data.versions && typeof data.versions === 'object') {
            Object.keys(data.versions).forEach(function(versionNum){
                var version = data.versions[versionNum];
                if (version.dist && version.dist.tarball && typeof version.dist.tarball === 'string') {
                    var parts = url.parse(version.dist.tarball);
                    version.dist.tarball = 'http://'+req.hostname+':'+port+parts.path;
                }
            });
        }
        var buf = new Buffer(JSON.stringify(data));
        cache.set(req.url, buf);
        res.type('json');
        res.send(buf);
    });
});

var server = app.listen(function(){
    port = exports.port = server.address().port;
    logger.info('listening on port', port);
    mdns.createAdvertisement(mdns.tcp('reginabox'), port).start();
    logger.info('broadcasting on mDNS');
    var child = spawn(
        path.resolve(require.resolve('registry-static'), '../../bin/registry-static'),
        ['-o', outputDir, '-d', 'localhost'],
        {stdio: 'inherit'}
    );
    process.on('SIGINT', function(){
        child.kill('SIGINT');
        process.kill();
    });
    logger.info('starting registry-static');
});

exports.close = function(){
    server.close();
};
