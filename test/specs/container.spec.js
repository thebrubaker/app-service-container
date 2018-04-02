const sinon = require('sinon');
const Container = require('../../');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * The Container manages how services are loaded and accessed. Example services would be
 * firebase, axios, auth0 or any other large package that the app uses. With
 * webpack code splitting, some services may be loaded asynchronously, and it would be
 * tedious if the developer had to manage how a service is loaded when building out a feature.
 * So instead we use a container to manage registering how a service is loaded, and how to access
 * that service.
 */
describe('Container', () => {
  it('should register a service', async done => {
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
    const fooResolved1 = sinon.spy();
    const fooResolved2 = sinon.spy();
    const service = () => 'bar';

    app.register('foo', async () => {
      return service;
    });

    app.resolved('foo', app => {
      fooResolved1();
      expect(app.foo).toBe(service);
    });

    app.resolved('foo', app => {
      fooResolved2();
      expect(app.foo).toBe(service);
    });

    expect(fooResolved1).not.toBeCalled;
    expect(fooResolved2).not.toBeCalled;

    const foo = await app('foo');

    expect(foo()).toEqual('bar');
    expect(fooResolved1).toBeCalled;
    expect(fooResolved2).toBeCalled;

    done();
  });

  it('should bootstrap a service', async done => {
    const app = new Container();
    const registered = sinon.spy();
    const resolved = sinon.spy();

    const bootstrapper = ({register, resolved}) => {
      register('foo', async () => {
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

    done();
  });

  it('should register groups', async done => {
    const app = new Container();
    const fooRegistered = sinon.spy();
    const barRegistered = sinon.spy();
    const resolved = sinon.spy();

    const bootstrapper = ({ register, resolved }) => {
      register('foo', async () => {
        fooRegistered();
        return () => 'bar';
      }).addToGroup('admin');

      register('bar', async () => {
        barRegistered();
        return () => 'bar';
      }).addToGroup('admin');

      resolved('admin', () => {
        resolved();
      });
    };

    app.bootstrap(bootstrapper);

    await app.resolve('admin');

    expect(fooRegistered).toBeCalled;
    expect(barRegistered).toBeCalled;
    expect(resolved).toBeCalled;
    done();
  });

  it('should register dependencies and resolve the tree', async done => {
    const foo = sinon.spy();
    const fooResolved = sinon.spy();
    const bar = sinon.spy();
    const barResolved = sinon.spy();    
    const baz = sinon.spy();
    const bazResolved = sinon.spy();
    const fuzz = sinon.spy();
    const fuzzResolved = sinon.spy();
    
    const app = new Container();
    app.register('foo', ['bar', 'baz'], async app => {
      fooResolved();
      expect(app.bar).toBeDefined;
      expect(app.baz).toBeDefined;
      return foo;
    });
    app.register('bar', ['fuzz'], async app => {
      barResolved();
      expect(app.fuzz).toBeDefined;
      return bar;
    });
    app.register('baz', async () => {
      timeout(300);
      bazResolved();
      return baz;
    });
    app.register('fuzz', ['baz'], async app => {
      fuzzResolved();
      expect(app.baz).toBeDefined;
      return fuzz;
    });
    await app('foo');
    expect(fooResolved).toBeCalled;
    expect(barResolved).toBeCalled;
    expect(bazResolved).toBeCalled;
    expect(fuzzResolved).toBeCalled;
    done();
  });
});
