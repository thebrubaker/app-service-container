(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AppServiceContainer = factory());
}(this, (function () { 'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var main = function () {
  /** 
   * The constructor for the container.
   */
  function Container() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Container);

    this.options = _extends({}, config);

    /**
     * The resolver functions for each service.
     */
    this.serviceResolvers = {};

    /**
     * The resolver functions for each service.
     */
    this.serviceGroups = {};

    /**
     * Services that have been resolved and are accessible from
     * the container.
     */
    this.resolvedServices = {};

    /**
     * The callbacks for each service to be called when the
     * service is resolved.
     */
    this.resolverCallbacks = {};

    /**
     * The dependency tree for registered services.
     */
    this.dependencyTree = {};

    return new Proxy(function () {}, this);
  }

  /**
   * Catch a function call to the Container. Resolves a service
   * asynchronously.
   * @param {Container} target
   * @param {Function} thisArg
   * @param {Array} argumentsList
   */


  _createClass(Container, [{
    key: 'apply',
    value: function apply(target, thisArg, argumentsList) {
      return this.resolve.apply(this, _toConsumableArray(argumentsList));
    }

    /**
     * The container is just a proxy to our registered services.
     * @param {Container} target
     * @param {String} prop
     * @param {Container} receiver
     */

  }, {
    key: 'get',
    value: function get(target, prop, receiver) {
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

  }, {
    key: 'register',
    value: function register(name, dependencies) {
      var _this = this;

      var resolver = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      var config = {
        name: name,
        dependencies: resolver ? dependencies : [],
        resolver: resolver ? resolver : dependencies
      };

      this.dependencyTree[config.name] = config.dependencies;
      this.serviceResolvers[config.name] = config.resolver;
      this.resolverCallbacks[config.name] = [];

      return {
        addToGroup: function addToGroup(groupName) {
          _this.addToGroup(groupName, config.name);
        }
      };
    }

    /**
     * Register a callback to be executed when a service is first resolved.
     * @param {String} name The name of the service.
     * @param {Function} callback The callback.
     */

  }, {
    key: 'resolved',
    value: function resolved(name, callback) {
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

  }, {
    key: 'bootstrap',
    value: function bootstrap(callbacks) {
      var _this2 = this;

      if (!Array.isArray(callbacks)) {
        callbacks = [callbacks];
      }

      callbacks.forEach(function (callback) {
        callback({
          register: _this2.register.bind(_this2),
          resolved: _this2.resolved.bind(_this2)
        });
      });
    }

    /**
     * Add a service to a group.
     * @param {String} groupName 
     * @param {String} serviceName 
     */

  }, {
    key: 'addToGroup',
    value: function addToGroup(groupName, serviceName) {
      if (this.isGroup(serviceName)) {
        throw new Error('Service is already registered as a group: ' + serviceName);
      }

      if (this.isGroup(groupName) && this.serviceGroups[groupName].indexOf(serviceName)) {
        return;
      }

      this.serviceGroups[groupName] = [].concat(_toConsumableArray(this.serviceGroups[groupName] || []), [serviceName]);
    }

    /**
     * Resolve a service from the container.
     * @param {String} name 
     * @returns {Promise}
     */

  }, {
    key: 'resolve',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(name) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.isGroup(name)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this.callGroupResolvers(name));

              case 2:
                if (this.isResolved(name)) {
                  _context.next = 5;
                  break;
                }

                _context.next = 5;
                return this.callServiceResolver(name);

              case 5:
                return _context.abrupt('return', this.getResolvedService(name));

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function resolve(_x3) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()

    /**
     * Resolve all the services in a group.
     * @param {String} name 
     */

  }, {
    key: 'callGroupResolvers',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(groupName) {
        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, name;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context2.prev = 3;
                _iterator = this.serviceGroups[groupName][Symbol.iterator]();

              case 5:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context2.next = 12;
                  break;
                }

                name = _step.value;
                _context2.next = 9;
                return this.resolve(name);

              case 9:
                _iteratorNormalCompletion = true;
                _context2.next = 5;
                break;

              case 12:
                _context2.next = 18;
                break;

              case 14:
                _context2.prev = 14;
                _context2.t0 = _context2['catch'](3);
                _didIteratorError = true;
                _iteratorError = _context2.t0;

              case 18:
                _context2.prev = 18;
                _context2.prev = 19;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 21:
                _context2.prev = 21;

                if (!_didIteratorError) {
                  _context2.next = 24;
                  break;
                }

                throw _iteratorError;

              case 24:
                return _context2.finish(21);

              case 25:
                return _context2.finish(18);

              case 26:
                return _context2.abrupt('return', this);

              case 27:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 14, 18, 26], [19,, 21, 25]]);
      }));

      function callGroupResolvers(_x4) {
        return _ref2.apply(this, arguments);
      }

      return callGroupResolvers;
    }()

    /**
     * Determines if the name is in the group resolvers.
     * @param {String} name 
     */

  }, {
    key: 'isGroup',
    value: function isGroup(name) {
      return this.serviceGroups[name] !== undefined;
    }

    /**
     * Returns the resolved service. If the service hasn't been resolved, the container throws
     * an error.
     * @param {String} name The name of the service.
     */

  }, {
    key: 'getResolvedService',
    value: function getResolvedService(name) {
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

  }, {
    key: 'isResolved',
    value: function isResolved(name) {
      return this.resolvedServices[name] !== undefined;
    }

    /**
     * Resolves an asynchronous service from the container. If the service
     * has already been resolved previously, return that service from
     * the container.
     * @param {String} name The name of the service to resolve.
     * @returns {Promise}
     */

  }, {
    key: 'callServiceResolver',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(name) {
        var _this3 = this;

        var service;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.resolveDependencyTree(name);

              case 2:
                service = _context3.sent;


                this.resolvedServices[name] = service;

                this.resolverCallbacks[name].forEach(function (callback) {
                  return callback(new Proxy(function () {}, _this3));
                });

                return _context3.abrupt('return', this.getResolvedService(name));

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function callServiceResolver(_x5) {
        return _ref3.apply(this, arguments);
      }

      return callServiceResolver;
    }()

    /**
     * Resolve the dependency tree for the given service.
     * @param {String} name 
     */

  }, {
    key: 'resolveDependencyTree',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(name) {
        var resolver, dependencies, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, service, module;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                resolver = this.serviceResolvers[name];

                if (resolver) {
                  _context4.next = 3;
                  break;
                }

                throw new Error('No resolver for service "' + name + '" registered in the container.');

              case 3:
                dependencies = this.dependencyTree[name] || [];
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context4.prev = 7;
                _iterator2 = dependencies[Symbol.iterator]();

              case 9:
                if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                  _context4.next = 16;
                  break;
                }

                service = _step2.value;
                _context4.next = 13;
                return this.resolve(service);

              case 13:
                _iteratorNormalCompletion2 = true;
                _context4.next = 9;
                break;

              case 16:
                _context4.next = 22;
                break;

              case 18:
                _context4.prev = 18;
                _context4.t0 = _context4['catch'](7);
                _didIteratorError2 = true;
                _iteratorError2 = _context4.t0;

              case 22:
                _context4.prev = 22;
                _context4.prev = 23;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 25:
                _context4.prev = 25;

                if (!_didIteratorError2) {
                  _context4.next = 28;
                  break;
                }

                throw _iteratorError2;

              case 28:
                return _context4.finish(25);

              case 29:
                return _context4.finish(22);

              case 30:
                _context4.next = 32;
                return resolver(new Proxy(function () {}, this));

              case 32:
                module = _context4.sent;
                return _context4.abrupt('return', module.default || module);

              case 34:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[7, 18, 22, 30], [23,, 25, 29]]);
      }));

      function resolveDependencyTree(_x6) {
        return _ref4.apply(this, arguments);
      }

      return resolveDependencyTree;
    }()
  }]);

  return Container;
}();

return main;

})));
