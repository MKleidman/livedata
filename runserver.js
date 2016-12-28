var http = require('http');
var csv = require('fast-csv');
var url = require('url');
var HttpDispatcher = require('httpdispatcher');
var $ = require('jquery');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var dispatcher = new HttpDispatcher();

function handleRequest(req, res) {
    /*
      Set up dispatcher and reroute index to the static html index file
    */
    try {
        var parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname === '/') {
            parsedUrl.pathname = '/static/html/index.html';
            req.url = url.format(parsedUrl);
        }
        dispatcher.dispatch(req, res);
    } catch(err) {
        console.log(err);
    }
}

dispatcher.setStatic('/static');
dispatcher.setStaticDirname('static');

dispatcher.onPost('/loaddata/', function(req, res) {
    res.setHeader('Content-Type', 'text/csv');
    var filepath = url.resolve('static/data/', req.params.filename);
    if (fs.existsSync(filepath)) {
        var data = [];
        csv.fromPath(filepath).on('data', function(d) {
            data.push(d.join(','));
        }).on('end', function() {
            res.end(data.join('\n'));
        });
    } else {
        res.writeHeader(404);
        res.end();
    }
});

http.createServer(handleRequest).listen(8080, 'localhost');
console.log('Server running at http://localhost:8080/');
