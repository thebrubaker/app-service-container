# app-service-container

This repo contains a bare-bones example of how to create a library using Rollup, including importing a module from `node_modules` and converting it from CommonJS.

We're creating a library called `how-long-till-lunch`, which usefully tells us how long we have to wait until lunch, using the [ms](https://github.com/zeit/ms) package:

## Getting started

Clone this repository and install its dependencies:

```bash
yarn add app-service-container
```

## Example

The following example shows you how to register a service, register callbacks on resolving that service, and how to use the service once registered.

```js
/**
 * This function allows you to register how a service is loaded
 * into the application, and what setup should be done when
 * that service is requested for the first time.
 *
 * @param {Function} register
 * @param {Function} resolved
 */
export default function(register, resolved) {
  /**
   * Register your service into the container. This is where
   * you might declare a service to be loaded asynchronously
   * into the container. If the second argument is a Promise,
   * the container assumes you will resolve with the service.
   */
  register('firebase', async () => {
    const firebase = await import('firebase');

    firebase.configure({
      // ...credentials
    });

    return firebase;
  });

  /**
   * If you have simple, synchronous imports that you want
   * to register into the container, but don't really require
   * any configuration, you can pass an object as the first
   * argument.
   */
  register({
    config: {},
    http: axios.create(),
    store: new Vuex.Store(),
    router: new VueRouter(),
  });

  /**
   * A service is resolved the first time it is requested
   * from the container. You can register a callback to
   * connect your service with other services once it's
   * resolved.
   */
  resolved('firebase', (container, firebase) => {
    Object.defineProperty(Vue.prototype, '$firebase', {
      get: () => container.firebase,
    });
  });
}

/**
 * This is an example route where we want to make
 * sure our firebase service is resolved before
 * a user tries to log in.
 */
const exampleRoute = {
  path: '/login',
  beforeEnter(to, from, next) {
    app.resolve('firebase').then(() => {
      next();
    });
  },
};

/**
 * Imagine this is a method on our LoginComponent for
 * signing a user in. Because we know our service is
 * resolved, and we registered how firebase should connect
 * to Vue when resolved, we can use it within our component.
 *
 * @param {String} email
 * @param {String} password
 */
function attemptLogin(email, password) {
  const auth = this.$firebase.auth();

  auth.signInWithEmailAndPassword(email, password).then(() => {
    this.$router.push('/admin/dashboard');
  });
}
```

## License

[MIT](LICENSE).
