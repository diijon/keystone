/**
 * Registers or retrieves a list
 */

function list(arg, tenant) {
	tenant = tenant || this.multitenantDefault;
	
	if (arg && arg.constructor === this.List) {
		this.lists[arg.key] = arg;
		this.paths[arg.path] = arg.key;
		return arg;
	}

	//console.log("arg:", arg, ", lists:", this.lists);
	
	var ret = this.lists[arg] || this.lists[this.paths[arg]];
	if (!ret) throw new ReferenceError('Unknown keystone list ' + JSON.stringify(arg));
	
	//console.log("core/list.js:ret.models", ret.models[tenant]);
	ret.model = ret.models[tenant].model;
	return ret;
}

module.exports = list;
