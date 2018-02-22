const sinon = require('sinon');
const Container = require('../../');

/**
 * The Container manages how services are loaded and accessed. Example services would be
 * firebase, axios, auth0 or any other large package that the app uses. With
 * webpack code splitting, some services may be loaded asynchronously, and it would be
 * tedious if the developer had to manage how a service is loaded when building out a feature.
 * So instead we use a container to manage registering how a service is loaded, and how to access
 * that service.
 */
describe('Container', () => {
  it('should register a synchronous service', () => {
    /**
     * Foo is a new service we want to register. It returns
     * the very important string "bar". Synchronous services
     * can be passed in as an argument on creating the container.
     */
    const app = new Container();

    app.register({
      foo: () => 'bar',
    });

    // We access the service by simply getting it as a prop off of app.
    const result = app.foo();

    expect(result).toEqual('bar');
  });

  it('should register an asynchronous service', async done => {
    const app = new Container();
    const service = () => 'bar';

    app.register('foo', async () => {
      return Promise.resolve(service);
    });

    const foo = await app('foo');

    expect(foo()).toEqual('bar');

    done();
  });

  it('should fire callbacks when a service is resolved', async done => {
    const app = new Container();
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const service = () => 'bar';

    app.register('foo', async () => {
      const foo = await Promise.resolve(service);

      return foo;
    });

    app.resolved('foo', (container, foo) => {
      spy1();
      expect(container.foo).toBe(service);
      expect(foo).toBe(service);
    });

    app.resolved('foo', (container, foo) => {
      spy2();
      expect(container.foo).toBe(service);
      expect(foo).toBe(service);
    });

    expect(spy1).not.toBeCalled;
    expect(spy2).not.toBeCalled;

    const foo = await app('foo');

    expect(foo()).toEqual('bar');
    expect(spy1).toBeCalled;
    expect(spy2).toBeCalled;

    done();
  });

  it('should bootstrap a service', () => {
    const app = new Container();
    const registered = sinon.spy();
    const resolved = sinon.spy();

    const bootstrapper = (register, resolved) => {
      register('foo', () => {
        registered();
        return () => 'bar';
      });
      resolved('foo', () => {
        resolved();
      });
    };

    app.bootstrap(bootstrapper);

    expect(registered).toBeCalled;
    expect(resolved).toBeCalled;
  });
});
