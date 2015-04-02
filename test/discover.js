var mockery = require('mockery');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var nock = require('nock');

describe('discover', function(){
    after(function(){
        // don't break other tests...
        nock.enableNetConnect();
    });
    describe('no hosts (none reported)', function(){
        var logged = [], exit, exitCode;
        before(function(){
            mockery.enable({
                warnOnUnregistered: false,
                useCleanCache: true,
                warnOnReplace: false
            });
            mockery.registerMock('mdns', {
                createBrowser: function(type) {
                    var emitter = new EventEmitter();
                    emitter.start = function() {
                    };
                    return emitter;
                },
                tcp: function(type) {
                    return 'tcp:'+type;
                }
            });
            global.log = function(){
                logged.push([].join.call(arguments, ' '));
            };
            exit = process.exit;
            process.exit = function(c) {
                exitCode = c;
            };
        });
        after(function(){
            mockery.deregisterAll();
            mockery.disable();
            mockery.resetCache();
        });
        it('finds it', function(done){
            require('../lib/discover');
            setTimeout(function(){
                assert.equal(exitCode, 1);
                assert.deepEqual(logged, ['Searching...', 'Couldn\'t find any reginabox registries!']);
                done();
            }, 1000);
        });
    });

    describe('no hosts (but one reported)', function(){
        var logged = [], exit, exitCode;
        before(function(){
            mockery.registerMock('mdns', {
                createBrowser: function(type) {
                    var emitter = new EventEmitter();
                    emitter.start = function() {
                        emitter.emit('serviceUp', {
                            addresses: ['1.2.3.4'],
                            port: 4444
                        });
                    };
                    return emitter;
                },
                tcp: function(type) {
                    return 'tcp:'+type;
                }
            });
            mockery.enable({
                warnOnUnregistered: false,
                useCleanCache: true,
                warnOnReplace: false
            });
            global.log = function(){
                logged.push([].join.call(arguments, ' '));
            };
            exit = process.exit;
            process.exit = function(c) {
                exitCode = c;
            };

        });
        after(function(){
            mockery.disable();
            mockery.resetCache();
        });
        it('finds it', function(done){
            require('../lib/discover');
            setTimeout(function(){
                assert.equal(exitCode, 1);
                assert.deepEqual(logged, ['Searching...', 'Couldn\'t find any reginabox registries!']);
                done();
            }, 1000);
        });
    });

    describe('single host', function(){
        var logged = [], exit, exitCode;
        before(function(){
            nock('http://1.2.3.4:4444')
                .get('/')
                .reply(200, {
                    sequence: 75,
                    latestSeq: 100
                }, {server: 'reginabox'});
            mockery.registerMock('mdns', {
                createBrowser: function(type) {
                    var emitter = new EventEmitter();
                    emitter.start = function() {
                        emitter.emit('serviceUp', {
                            addresses: ['1.2.3.4'],
                            port: 4444
                        });
                    };
                    return emitter;
                },
                tcp: function(type) {
                    return 'tcp:'+type;
                }
            });
            mockery.enable({
                warnOnUnregistered: false,
                useCleanCache: true,
                warnOnReplace: false
            });
            global.log = function(){
                logged.push([].join.call(arguments, ' '));
            };
            exit = process.exit;
            process.exit = function(c) {
                exitCode = c;
            };

        });
        after(function(){
            mockery.disable();
            mockery.resetCache();
        });
        it('finds it', function(done){
            require('../lib/discover');
            setTimeout(function(){
                assert.deepEqual(logged, [
                    'Searching...',
                    'Found registry!',
                    '',
                    'http://1.2.3.4:4444',
                    ' --> Freshness: 75%',
                    '\n\nTo use a registry, for a given URL, do the following:',
                    '  $ npm config set registry URL'
                ]);
                done();
            }, 1000);
        });
    });

    describe('multiple hosts', function(){
        var logged = [], exit, exitCode;
        before(function(){
            nock('http://1.2.3.4:4444')
                .get('/')
                .reply(200, {
                    sequence: 75,
                    latestSeq: 100
                }, {server: 'reginabox'});
            nock('http://4.3.2.1:5555')
                .get('/')
                .reply(200, {
                    sequence: 85,
                    latestSeq: 100
                }, {server: 'reginabox'});

            mockery.registerMock('mdns', {
                createBrowser: function(type) {
                    var emitter = new EventEmitter();
                    emitter.start = function() {
                        emitter.emit('serviceUp', {
                            addresses: ['1.2.3.4'],
                            port: 4444
                        });
                        emitter.emit('serviceUp', {
                            addresses: ['4.3.2.1'],
                            port: 5555
                        });
                    };
                    return emitter;
                },
                tcp: function(type) {
                    return 'tcp:'+type;
                }
            });
            mockery.enable({
                warnOnUnregistered: false,
                useCleanCache: true,
                warnOnReplace: false
            });
            global.log = function(){
                logged.push([].join.call(arguments, ' '));
            };
            exit = process.exit;
            process.exit = function(c) {
                exitCode = c;
            };

        });
        after(function(){
            mockery.disable();
            mockery.resetCache();
        });
        it('finds it', function(done){

            require('../lib/discover');
            setTimeout(function(){
                assert.deepEqual(logged, [
                    'Searching...',
                    'Found registries!',
                    '',
                    'http://1.2.3.4:4444',
                    ' --> Freshness: 75%',
                    '',
                    'http://4.3.2.1:5555',
                    ' --> Freshness: 85%',
                    '\n\nTo use a registry, for a given URL, do the following:',
                    '  $ npm config set registry URL'
                ]);
                done();
            }, 1000);
        });

    });
});
