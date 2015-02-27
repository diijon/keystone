![KeystoneJS](http://keystonejs.com/images/logo.svg)
===================================

See original instructions for [linking](https://github.com/keystonejs/keystone#linking-keystone-for-development-and-testing) using the multitenant branch

See original [usage instructions](https://github.com/keystonejs/keystone#usage)

In your project directory initialize your Keystone object like so:
```javascript
var _ = require('underscore'),
    keystone = require('keystone'),
    mongoose = require('mongoose');

var tenants = {
	'tenant1': 'mongodb://localhost/tenant1',
	'tenant2': 'mongodb://localhost/tenant2'
};
_.each(tenants, function(mongo, tenant){
	mongoose.createConnection(mongo);
});

keystone.init({
    //...
	'auth': function(req, res, next){
		//TODO: add custom authentication if desired
		//TODO: validate and/or authorize req.tenant, call next() if tenant allowed, or redirect
		next();
	},

	'user model': 'User',

	'mongoose' : mongoose,
	'multitenant map': tenants,
	'multitenant default': 'tenant1',
	'multitenant find': function(req, res, next){
		var selectedTenant = req.tenant;

		//TODO: override tenant retrieval by looking somewhere else? cookie? local storage? database?
		return selectedTenant;
	}
});
```
