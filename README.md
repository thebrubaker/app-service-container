# App Service Container

This package solves the problem of code-splitting large libraries in a single page application. It's a design pattern that involves a bit more structure for how services are "loaded" into your app, but once they have been registered, it becomes trivial to access them without having to think which webpack chunk they belong to. It will help you potentially improve your PWA scores by reducing the initial size of your app by separating your core packages from your other packages.

## Getting started

To start using the container, add this package to your project:

```bash
yarn add app-service-container
```

Then we simply create a new instance of the container like so:

```js
import Container from 'app-service-container';

const app = new Container();

export default app;
```

Once we have the container, we go about registering our services. Let's start with an example of a large package such as Firebase that we only want to use in our "admin" routes.

```js
import Container from 'app-service-container';
import firebase from 'firebase';

const app = new Container();

app.register('firebase', async () => {
  // This is webpack codesplitting, read more here: https://webpack.js.org/guides/code-splitting/
  const firebase = await import('firebase');

  firebase.initializeApp({
    // ...
  });

  return firebase;
});

export default app;
```

To access our service, we would make a request for it from the container:

```js
import app from './app';

// this resolves the import and registers it in the container.
app.resolve('firebase').then(firebase => {
  // ...
});

// you can also resolve it with a shorter syntax
app('firebase').then(firebase => {
  // ...
});
```

Once the service has been resolved, it's available statically from the container:

```js
import app from './app';

app('firebase').then(firebase => {
  // it's now simple to access
  console.log(app.firebase);
});
```

It's a good idea to register all of your services in the container, even if they aren't split.

```js
const router = new VueRouter({
  /* ... */
});
const store = new Vuex.Store({
  /* ... */
});
const vue = new Vue({
  router,
  store,
});

app.register({
  vue,
  router,
  store,
});
```

Usually you will want to connect a service with other parts of your application. You can register how it should connect in the following way:

```js
import Vue from 'vue';

// Executes the callback when the service is resolved.
app.resolved('firebase', (container, firebase) => {
  Vue.prototype.$firebase = firebase;
});
```

The next step would be to separate the registration of services into individual files for better organization. So for our firebase example, we would have the following structure:

```
src/
  app/
    bootstrap/
      firebase.js
    index.js
  components/
  routes/
  store/
```

```js
/* src/app/bootstrap/firebase.js */

import firebase from 'firebase';
import Vue from 'vue';

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
   * into the container.
   */
  register('firebase', async () => {
    const firebase = await import('firebase');

    firebase.initializeApp({
      // ...credentials
    });

    return firebase;
  });

  /**
   * A service is resolved the first time it is requested
   * from the container. You can register a callback to
   * connect your service with other services once it's
   * resolved.
   */
  resolved('firebase', container => {
    Object.defineProperty(Vue.prototype, '$firebase', {
      get: () => container.firebase,
    });
  });
}
```

```js
/* src/app/index/js */

import Container from 'app-service-container';
import firebase from './bootstrap/firebase';

const app = new Container();

firebase(app.register, app.resolved);
/* or */
app.bootstrap(firebase);

export app;
```

Now our code is easier to reason about where and how things are bootstrapped. Now let's look at why this type of design pattern would be effective in a large Single Page Application.

## Example Vue Solution

Imagine our application has a simple group of public pages that we want to load quickly, and only require our core services to function. We also have an admin part of our app, and when visiting these pages, we want to make sure our services are loaded and usable.

The following example shows you how to register a service, register callbacks on resolving that service, and how to use the service once registered.

```js
/* app.js */

import Container from 'app-service-container';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import firebase from 'firebase';

const app = new Container();

const router = new VueRouter({
  /* ... */
});

const store = new Vuex.Store({
  /* ... */
});

const vue = new Vue({
  el: '#app',
  router,
  store,
});

app.register({
  vue,
  router,
  store,
});

app.register('firebase', async () => {
  const firebase = await import(/* webpackChunkName: "admin" */ 'firebase');

  firebase.initializeApp({
    // ...
  });

  return firebase;
});

app.resolved('firebase', (container, firebase) => {
  Object.defineProperty(Vue.prototype, '$firebase', {
    get: () => container.firebase,
  });
});

export default app;
```

```js
/* routes.js */
import app from './app';

export default [
  /**
   * This is an example route where we want to make
   * sure our firebase service is resolved before
   * a user tries to log in.
   */
  {
    path: '/login',
    beforeEnter(to, from, next) {
      app.resolve('firebase').then(next);
    },
  },
];
```

```js
/* login-component.js */

export default {
  methods: {
    /**
     * Imagine this is a method on our LoginComponent for
     * signing a user in. Because we know our service is
     * resolved, and we registered how firebase should connect
     * to Vue when resolved, we can use it within our component.
     *
     * @param {String} email
     * @param {String} password
     */
    attemptLogin(email, password) {
      this.$firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          this.$router.push('/admin/dashboard');
        });
    },
  },
};
```

So to recap the steps involved, we registered our service in the container (including which code chunk it would belong to), registered a callback for how the service should connect with our other packages when resolved, registered that we wanted to resolve our service when hitting a route where the service is needed, and then used the service directly in our component.

Once you register all of your application's core services, you can stop thinking about code splitting and just use them as you are building out features.

## License

[MIT](LICENSE).
