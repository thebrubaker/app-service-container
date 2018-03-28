module.exports = class Container {
  /** 
   * The constructor for the container.
   */
  constructor() {
    this.serviceResolvers = {};
    this.resolvedServices = {};
    this.resolverCallbacks = {};

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
   * @param {Container} receiver
   */
  get(target, prop, receiver) {
    if (this[prop] !== undefined) {
      return this[prop];
    }

    return this.getResolvedService(prop);
  }

  /**
   * Sets a resolved service on the container.
   * @param {Container} target
   * @param {String} prop
   * @param {Any} value
   */
  set(target, prop, value) {
    this.resolvedServices[prop] = value;
    return value;
  }

  /**
   * Register a service in the container.
   * @param {String|Object} name 
   * @param {Function} resolver 
   */
  register(name, resolver) {
    this.serviceResolvers[name] = resolver;
    this.resolverCallbacks[name] = [];
  }

  /**
   * Resolve a service from the container.
   * @param {String} name 
   * @returns {Promise}
   */
  async resolve(name) {
    if (this.isGroup(name)) {
      return this.callGroupResolvers(name);
    }

    if (!this.isResolved(name)) {
      await this.callServiceResolver(name)
    }
    
    return this.getResolvedService(name);
  }

  /**
   * Resolve all the services in a group.
   * @param {String} name 
   */
  async callGroupResolvers(name) {
    await Promise.all(this.serviceResolvers[name].map(serviceName => {
      return this.resolve(serviceName);
    }))

    return this.resolvedServices;
  }

  /**
   * Determines if the name is in the group resolvers.
   * @param {String} name 
   */
  isGroup(name) {
    return Array.isArray(this.serviceResolvers[name]);
  }

  /**
   * Returns the resolved service. If the service hasn't been resolved, the container throws
   * an error.
   * @param {String} name The name of the service.
   */
  getResolvedService(name) {
    if (!this.isResolved(name)) {
      throw new Error(
        `Attemping to access a service that has not been resolved: ${name}.`
      );
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
  async callServiceResolver(name) {
    const resolver = this.serviceResolvers[name];

    if (!resolver) {
      throw new Error(
        `No resolver for service "${name}" registered in the container.`,
      );
    }

    const module = await resolver();

    this.resolvedServices[name] = module.default || module;;

    this.resolverCallbacks[name].forEach(callback => callback(this.resolvedServices));

    return this.getResolvedService(name);
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
    if (Array.isArray(callbacks)) {
      return callbacks.map(callback => {
        return callback({
          register: this.register.bind(this),
          resolved: this.resolved.bind(this),
        })
      })
    }
    return callbacks({
      register: this.register.bind(this),
      resolved: this.resolved.bind(this),
    })
  }
}
