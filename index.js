#!/usr/bin/env node

/*
 * tiny-dns
 *
 * Copyright(c) 2015 by HDS Home Design Solutions GmbH
 * MIT Licensed
 */

/**
 * @author André König <andre@homedesignsolutions.de>
 * @author Alexander Thiel <alexander@homedesignsolutions.de>
 *
 */

'use strict';

var path = require('path');
var util = require('util');
var fs = require('fs');
var dns = require('native-dns');

var pkg = require('./package.json');

var recordsPath = path.join(process.cwd(), 'records.json');
//It's important to use intervals for cases where we can't rely on the file system (e.g. nfs shares in docker containers)
var watchOptions = {
    persistent: false,
    interval:   1000
};
var ttl = 300;
var port = 53;
var server;
var records = {};

function loadRecords() {
    records = require(recordsPath);
}

function info(message) {
    console.log(util.format('%s: %s', pkg.name, message));
}

fs.watchFile(recordsPath, watchOptions, function () {
    loadRecords();
    console.log(util.format('Updated records (now serving %d records).', Object.keys(records).length));
});


server = dns.createServer();

loadRecords();

server.on('request', function (request, response) {

    var name = request.question[0].name;

    response.answer.push(dns.A({
        name:    name,
        address: records[name],
        ttl:     ttl
    }));
    response.send();
});

info(util.format('Starting dns server for %d records on port %d', Object.keys(records).length, port));

server.serve(port);

