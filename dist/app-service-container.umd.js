(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AppServiceContainer = factory());
}(this, (function () { 'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var main = class Container {
  /**
   * The constructor for the container.
   */
  constructor(config = {}) {
    this.options = {};

    /**
     * The resolver functions for each service.
     */
    this.serviceResolvers = {};

    /**
     * The services that should be resolved together.
     */
    this.serviceGroups = {};

    /**
     * Services that have been resolved and are accessible from
     * the container.
     */
    this.resolvedServices = {};

    /**
     * The callbacks for each service to be called when the
     * service is first resolved.
     */
    this.resolverCallbacks = {};

    /**
     * The dependency tree for registered services.
     */
    this.dependencyTree = {};

    this.options.config = config;

    return new Proxy(() => {}, this);
  }

  /**
   * Catch a function call to the Container. Resolves a service
   * asynchronously.
   * @param {Container} target
   * @param {Function} thisArg
   * @param {Array} argumentsList
   */
  apply(target, thisArg, argumentsList) {
    return this.resolve(...argumentsList);
  }

  /**
   * The container is just a proxy to our registered services.
   * @param {Container} target
   * @param {String} prop
   * @param {mixed} value
   */
  set(target, prop, value) {
    this.options[prop] = value;

    return value;
  }

  /**
   * The container is just a proxy to our registered services.
   * @param {Container} target
   * @param {String} prop
   * @param {Container} receiver
   */
  get(target, prop, receiver) {
    if (prop === 'config') {
      return this.options.config;
    }

    if (this[prop] !== undefined) {
      return this[prop];
    }

    return this.getResolvedService(prop);
  }

  /**
   * Register a service in the container.
   * @param {String|Object} name
   * @param {Array} dependencies
   * @param {Function} resolver
   */
  register(name, dependencies, resolver = null) {
    const config = {
      name: name,
      dependencies: resolver ? dependencies : [],
      resolver: resolver ? resolver : dependencies
    };

    this.dependencyTree[config.name] = config.dependencies;
    this.serviceResolvers[config.name] = config.resolver;
    this.resolverCallbacks[config.name] = [];

    return {
      addToGroup: groupName => {
        this.addToGroup(groupName, config.name);
      }
    };
  }

  /**
   * Register a callback to be executed when a service is first resolved.
   * @param {String} name The name of the service.
   * @param {Function} callback The callback.
   */
  resolved(name, callback) {
    if (this.resolverCallbacks[name] === undefined) {
      this.resolverCallbacks[name] = [];
    }

    this.resolverCallbacks[name].push(callback);
  }

  /**
   * Bootstrap a service using a callback or callbacks.
   *
   * @param {Array|Function} callbacks
   */
  bootstrap(callbacks) {
    if (!Array.isArray(callbacks)) {
      callbacks = [callbacks];
    }

    callbacks.forEach(callback => {
      callback({
        register: this.register.bind(this),
        resolved: this.resolved.bind(this)
      });
    });
  }

  /**
   * Add a service to a group.
   * @param {String} groupName
   * @param {String} serviceName
   */
  addToGroup(groupName, serviceName) {
    if (!this.isGroup(groupName)) {
      this.serviceGroups[groupName] = [];
      this.resolverCallbacks[groupName] = [];
    }

    if (this.serviceGroups[groupName].includes(serviceName)) {
      return;
    }

    this.serviceGroups[groupName] = [...this.serviceGroups[groupName], serviceName];
  }

  /**
   * Resolve a service from the container.
   * @param {String} name
   * @returns {Promise}
   */
  resolve(name) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (_this.isGroup(name)) {
        return _this.callGroupResolvers(name);
      }

      if (!_this.isResolved(name)) {
        yield _this.callServiceResolver(name);
      }

      return _this.getResolvedService(name);
    })();
  }

  /**
   * Resolve all the services in a group.
   * @param {String} name
   */
  callGroupResolvers(groupName) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      for (let name of _this2.serviceGroups[groupName]) {
        yield _this2.resolve(name);
      }

      _this2.resolverCallbacks[groupName].forEach(function (callback) {
        return callback(new Proxy(function () {}, _this2));
      });

      return _this2;
    })();
  }

  /**
   * Determines if the name is in the group resolvers.
   * @param {String} name
   */
  isGroup(name) {
    return this.serviceGroups[name] !== undefined;
  }

  /**
   * Returns the resolved service. If the service hasn't been resolved, the container throws
   * an error.
   * @param {String} name The name of the service.
   */
  getResolvedService(name) {
    if (!this.isResolved(name)) {
      return undefined;
    }

    return this.resolvedServices[name];
  }

  /**
   * Determines if the service has been registered.
   * @param {String} name The name of the service to check.
   * @returns {Boolean}
   */
  isResolved(name) {
    return this.resolvedServices[name] !== undefined;
  }

  /**
   * Resolves an asynchronous service from the container. If the service
   * has already been resolved previously, return that service from
   * the container.
   * @param {String} name The name of the service to resolve.
   * @returns {Promise}
   */
  callServiceResolver(name) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const service = yield _this3.resolveDependencyTree(name);

      _this3.resolvedServices[name] = service;

      _this3.resolverCallbacks[name].forEach(function (callback) {
        return callback(new Proxy(function () {}, _this3));
      });

      return _this3.getResolvedService(name);
    })();
  }

  /**
   * Resolve the dependency tree for the given service.
   * @param {String} name
   */
  resolveDependencyTree(name) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const resolver = _this4.serviceResolvers[name];

      if (!resolver) {
        throw new Error(`No resolver for service "${name}" registered in the container.`);
      }

      const dependencies = _this4.dependencyTree[name] || [];

      for (let service of dependencies) {
        yield _this4.resolve(service);
      }

      const module = yield resolver(new Proxy(function () {}, _this4));

      return module.default || module;
    })();
  }
};

return main;

})));
