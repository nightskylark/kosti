var norseUtils = require('norseUtils');
var portal = require('/lib/xp/portal');
var contextLib = require('/lib/contextLib');
var contentLib = require('/lib/xp/content');
var helpers = require('helpers');
var thymeleaf = require('/lib/xp/thymeleaf');

exports.get = function( req ) {
    var params = req.params;
    switch( params.action ){
        case "games":
            var view = resolve('kosticon2019.html');
            var model = {
                pageComponents: helpers.getPageComponents(req)
            };
            break;
        default: 
            var view = resolve('kosticon2019.html');
            var model = {
                pageComponents: helpers.getPageComponents(req)
            };
            break;
    }
    return {
        body: thymeleaf.render(view, model),
        contentType: 'text/html'
    }
};


exports.post = function( req ) {
    var params = req.params;
    norseUtils.log(params);
    switch( params.action ){
        case "submitForm":
            delete params.action;
            norseUtils.log(params);
            var view = resolve('successSubmit.html');
            var model = {
                pageComponents: helpers.getPageComponents(req)
            };
            break;
        default: 
            var view = resolve('successSubmit.html');
            var model = {
                pageComponents: helpers.getPageComponents(req)
            };
            break;
    }
    return {
        body: thymeleaf.render(view, model),
        contentType: 'text/html'
    }
};