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
    return this.resolveAsyncService(...argumentsList);
  }

  /**
   * The container is just a proxy to our registered services.
   * @param {Container} target
   * @param {String} prop
   * @param {Container} receiver
   */
  get(target, prop, receiver) {
    switch (prop) {
      case 'serviceResolvers':
      case 'resolvedServices':
      case 'resolverCallbacks':
      case 'register':
      case 'isResolved':
      case 'registerService':
      case 'registerAsyncService':
      case 'resolveAsyncService':
      case 'getResolvedService':
      case 'resolved':
        return this[prop];
      default:
        return this.getResolvedService(prop);
    }
  }

  /**
   * Sets a resolved service on the container.
   * @param {Container} target
   * @param {String} prop
   * @param {Any} value
   */
  set(target, prop, value) {
    this.registerService(prop, value)
  }

  /**
   * Register a service in the container.
   * @param {String|Object} name 
   * @param {Function} resolver 
   */
  register(name, resolver) {
    if (typeof name === 'string') {
      return this.registerAsyncService(name, resolver)
    }

    Object.keys(name).forEach(key => {
      this.registerService(key, name[key])
    });
  }

  /**
   * Returns the resolved service. If the service hasn't been resolved, the container throws
   * an error.
   * @param {String} name The name of the service.
   */
  getResolvedService(name) {
    if (this.resolvedServices[name] === undefined) {
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
   * Registers a service that is already resolved. If your service
   * is asynchronously loaded, use registerAsyncService instead.
   * @param {String} name The name of the service.
   * @param {Any} service The service to register.
   */
  registerService(name, service) {
    this.resolvedServices[name] = service;
  }

  /**
   * Register a new async service for the given name. The resolver should return a Promise
   * that resolves with the service.
   * @param {String} name The name of the service.
   * @param {Function} resolver A function that returns a Promise with the service.
   */
  registerAsyncService(name, resolver) {
    this.serviceResolvers[name] = resolver;
  }

  /**
   * Resolves an asynchronous service from the container. If the service
   * has already been resolved previously, return that service from
   * the container.
   * @param {String} name The name of the service to resolve.
   * @returns {Promise}
   */
  async resolveAsyncService(name) {
    if (this.isResolved(name)) {
      return Promise.resolve(this.getResolvedService(name));
    }

    const resolver = this.serviceResolvers[name];

    if (!resolver) {
      throw new Error(
        `No resolver for async service ${name} registered in the container.`,
      );
    }

    const module = await resolver();
    const service = module.default || module;

    this.resolvedServices[name] = service;

    (this.resolverCallbacks[name] || []).forEach(callback => callback(this, service));

    return service;
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
}
