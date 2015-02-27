var _ = require('underscore'),
	debug = require('debug')('keystone:core:routes');
/**
 * Adds bindings for the keystone routes
 *
 * ####Example:
 *
 *     var app = express();
 *     app.use(...); // middleware, routes, etc. should come before keystone is initialised
 *     keystone.routes(app);
 *
 * @param {Express()} app
 * @api public
 */

function routes(app) {
	
	this.app = app;
	var keystone = this;
	
	// ensure keystone nav has been initialised
	if (!this.nav) {
	  debug('setting up nav');
		this.nav = this.initNav();
	}
	
	// Cache compiled view templates if we are in Production mode
	this.set('view cache', this.get('env') === 'production');


	var verifyTenant = function(){
		return function(req, res, next){
			if(req.path.indexOf('notenant') >= 0){
				next();
			}
			
			var tenant = req.params.tenant || keystone.multitenantDefault;
			
			//console.log("routes::req.params.tenant", tenant);
			//req.tenant = keystone.multitenantFind(req, res); //controls access to the tenant

			if(!tenant){
				debug('Tenant is missing from route');
				req.flash('error', 'Tenant is missing from route.');
				return res.redirect('/keystone/notenant');
			}

			var mtMapping = keystone.multitenantMap[tenant];
			if(_.isUndefined(mtMapping)){
				debug('could not find tenant ', tenant);
				req.flash('error', 'Tenant ' + tenant + ' could not be found.');
				return res.redirect('/keystone/notenant');
			}

			req.tenant = tenant;
			next();
		}
	};
	
	var authTenant = function(){
		return function(req, rex, next){
			if(req.path.indexOf('notenant') >= 0){
				next();
			}
			if(_.isUndefined(keystone.multitenantMap[req.tenant])){
				return res.redirect('/keystone/notenant');
			}
			next();
		}
	};
	
	// Bind auth middleware (generic or custom) to /keystone* routes, allowing
	// access to the generic signin page if generic auth is used
	
	if (this.get('auth') === true) {
		debug('setting up auth');

		if (!this.get('signout url')) {
			this.set('signout url', '/keystone/signout');
		}
		if (!this.get('signin url')) {
			this.set('signin url', '/keystone/signin');
		}
		
		if (!this.nativeApp || !this.get('session')) {
			app.all('/keystone*', this.session.persist);
		}
		
		app.all('/keystone/signin', require('../../routes/views/signin'));
		app.all('/keystone/signout', require('../../routes/views/signout'));
		app.all('/keystone*', this.session.keystoneAuth);
		
	} else if ('function' === typeof this.get('auth')) {
		debug('setting up auth');
		app.all('/keystone*', verifyTenant(), authTenant(), this.get('auth'));
	}
	
	var initList = function(protect) {
		return function(req, res, next) {
			
			req.list = keystone.list(req.params.list, req.params.tenant);
			
			if (!req.list || (protect && req.list.get('hidden'))) {
				debug('could not find list ', req.params.list);
				req.flash('error', 'List ' + req.params.list + ' could not be found.');
				return res.redirect('/keystone');
			}
			debug('getting list ', req.params.list);
			next();
		};
	};
	
	debug('setting keystone Admin Route');
	app.all('/keystone', require('../../routes/views/home'));
	
	// Email test routes
	if (this.get('email tests')) {
		debug('setting email test routes');
		this.bindEmailTestRoutes(app, this.get('email tests'));
	}
	
	// Cloudinary API for image uploading (only if Cloudinary is configured)
	if (keystone.get('wysiwyg cloudinary images')) {
		if (!keystone.get('cloudinary config')) {
			throw new Error('KeystoneJS Initialisaton Error:\n\nTo use wysiwyg cloudinary images, the \'cloudinary config\' setting must be configured.\n\n');
		}
		debug('setting wysiwyg cloudinary images');
		app.post('/keystone/api/cloudinary/upload', require('../../routes/api/cloudinary').upload);
	}
	
	// Cloudinary API for selecting an existing image from the cloud
	if (keystone.get('cloudinary config')) {
		debug('setting cloudinary api');
		app.get('/keystone/api/cloudinary/get', require('../../routes/api/cloudinary').get);
		app.get('/keystone/api/cloudinary/autocomplete', require('../../routes/api/cloudinary').autocomplete);
	}

	// Generic Lists API
	debug('setting generic list api');
	app.all('/keystone/api/:tenant/:list/:action', initList(), require('../../routes/api/list'));
	
	debug('setting generic Lists download route');
	app.all('/keystone/:tenant/download/:list', initList(), require('../../routes/download/list'));
	
	debug('setting list and item details admin routes');
	app.all('/keystone/:tenant', verifyTenant(), authTenant(), require('../../routes/views/home'));
	app.all('/keystone/:tenant/:list/:page([0-9]{1,5})?', initList(true), require('../../routes/views/list'));
	app.all('/keystone/:tenant/:list/:item', initList(true), require('../../routes/views/item'));
	
	return this;
	
}

module.exports = routes;
