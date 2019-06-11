var contentLib = require('/lib/xp/content');
var thymeleaf = require('/lib/thymeleaf');
var portal = require('/lib/xp/portal');

var libLocation = '../../site/lib/';
var userLib = require(libLocation + 'userLib');
var mailsLib = require(libLocation + 'mailsLib');
var contextLib = require(libLocation + 'contextLib');
var helpers = require(libLocation + 'helpers');
var norseUtils = require(libLocation + 'norseUtils');

var templates = {
    forgotPassForm: "forgotPassForm.html",
    resetFailed: "resetFailed.html",
    unsubscribe: "unsubscribe.html",
    userActivation: "userActivation.html"
}

exports.get = function( req ) {
    var params = req.params;
    var model = { pageComponents: helpers.getPageComponents(req) };
    var view = false;
    switch( params.action ){
        case "logout":
            return logout();
            break;
        case "confirmRegister":
            view = resolve(templates.userActivation);
            model.activation = userLib.activateUser( decodeURIComponent(params.mail), params.hash );
            break;
        case "forgotPass":
            view = resolve(templates.forgotPassForm);
            model.email = params.mail;
            model.hash = params.hash;
            model.hashMatch = userLib.forgotPass( decodeURIComponent(params.mail), params.hash );
            break;
        case "newsletterUnsubscribe":
            mailsLib.unsubscribe( params.hash );
            view = resolve(templates.unsubscribe);
            break;
        default:
            break;
    }
    return {
        body: thymeleaf.render(view, model),
        contentType: 'text/html'
    }
};

exports.post = function( req ) {
	var result = false;
    var params = req.params;
    if( params.action == 'register' ){
	    contextLib.runAsAdmin(function () {
		    result = userLib.register( params.username, params.email, params.password );
	    });
    } else if( params.action == 'login' ){
	    result = userLib.login( params.username, params.password );
	} else if( params.action == 'image' ){
        result = userLib.uploadUserImage();
    } else if( params.action == 'edit' ){
        result = userLib.editUser(params);
    } else if( params.action == 'forgotpass' ){
        result = userLib.resetPass( params.email );
    } else if( params.action == 'addBookmark' ){
        result = userLib.addBookmark( params.id );
    } else if( params.action == 'googleRegister' ){
        //norseUtils.log(params);
        result = userLib.jwtRegister( params.token );
    } else if( params.action == 'resetpass' ){
        if( userLib.setNewPass( params.password, params.email, params.hash ) ){
            return logout();
        } else {
            return {
                body: thymeleaf.render(resolve(templates.resetFailed), {
                    pageComponents: helpers.getPageComponents(req)
                }),
                contentType: 'text/html'
            }
        }
    }
    return {
        body: result,
        contentType: 'application/json'
    }
};

function logout(){
    userLib.logout();
    var site = portal.getSite();
    return {
        redirect: portal.pageUrl({ path: site._path })
    }
}