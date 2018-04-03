module.exports = class Container
{
  /** 
   * The constructor for the container.
   */
  constructor(config = {}) {
    this.options = {
      ...config,
    };

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
      resolver: resolver ? resolver : dependencies,
    };

    this.dependencyTree[config.name] = config.dependencies;
    this.serviceResolvers[config.name] = config.resolver;
    this.resolverCallbacks[config.name] = [];
    
    return {
      addToGroup: (groupName) => {
        this.addToGroup(groupName, config.name);
      }
    }
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
        resolved: this.resolved.bind(this),
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
    }

    if (this.serviceGroups[groupName].includes(serviceName)) {
      return;
    }

    this.serviceGroups[groupName] = [
      ...this.serviceGroups[groupName],
      serviceName,
    ];
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
      await this.callServiceResolver(name);
    }
    
    return this.getResolvedService(name);
  }

  /**
   * Resolve all the services in a group.
   * @param {String} name 
   */
  async callGroupResolvers(groupName) {
    for (let name of this.serviceGroups[groupName]) {
      await this.resolve(name);
    }

    return this;
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
  async callServiceResolver(name) {
    const service = await this.resolveDependencyTree(name);

    this.resolvedServices[name] = service;

    this.resolverCallbacks[name].forEach(callback => callback(new Proxy(() => {}, this)));

    return this.getResolvedService(name);
  }

  /**
   * Resolve the dependency tree for the given service.
   * @param {String} name 
   */
  async resolveDependencyTree(name) {
    const resolver = this.serviceResolvers[name];

    if (!resolver) {
      throw new Error(
        `No resolver for service "${name}" registered in the container.`,
      );
    }

    const dependencies = this.dependencyTree[name] || [];

    for (let service of dependencies) {
      await this.resolve(service);
    }

    const module = await resolver(new Proxy(() => {}, this));

    return module.default || module;
  }
};
