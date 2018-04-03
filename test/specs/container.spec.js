const sinon = require('sinon');
const Container = require('../../src/main');

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
    const config = {};
    const app = new Container(config);
    const service = () => 'bar';

    app.register('foo', async () => {
      return Promise.resolve(service);
    });

    const foo = await app('foo');

    app.debug = true;

    expect(foo()).toEqual('bar');
    expect(app.config).toEqual(config);
    expect(app.options.debug).toEqual(true);

    done();
  });

  it('should fire callbacks when a service is resolved', async done => {
    const app = new Container();
    const fooResolved1 = jest.fn();
    const fooResolved2 = jest.fn();
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

    expect(fooResolved1).not.toBeCalled();
    expect(fooResolved2).not.toBeCalled();

    const foo = await app('foo');

    expect(foo()).toEqual('bar');
    expect(fooResolved1).toBeCalled();
    expect(fooResolved2).toBeCalled();

    done();
  });

  it('should bootstrap a service', async done => {
    const app = new Container();
    const wasRegistered = jest.fn();
    const wasResolved = jest.fn();

    const bootstrapper = ({register, resolved}) => {
      register('foo', async () => {
        wasRegistered();
        return () => 'bar';
      });
      resolved('foo', () => {
        wasResolved();
      });
    };

    app.bootstrap(bootstrapper);

    await app('foo');

    expect(wasRegistered).toBeCalled();
    expect(wasResolved).toBeCalled();

    done();
  });

  it('should register groups', async done => {
    const app = new Container();
    const fooRegistered = jest.fn();
    const barRegistered = jest.fn();
    const wasResolved = jest.fn();

    const bootstrapper = ({ register, resolved }) => {
      register('foo', async () => {
        fooRegistered();
        return () => 'bar';
      }).addToGroup('admin');

      register('foo', async () => {
        fooRegistered();
        return () => 'bar';
      }).addToGroup('admin');

      register('bar', async () => {
        barRegistered();
        return () => 'bar';
      }).addToGroup('admin');

      resolved('admin', () => {
        wasResolved();
      });
    };

    app.bootstrap(bootstrapper);

    expect(app.serviceGroups.admin).toEqual(expect.arrayContaining(['foo', 'bar']));

    await app.resolve('admin');

    expect(fooRegistered).toBeCalled();
    expect(barRegistered).toBeCalled();
    expect(wasResolved).toBeCalled();
    done();
  });

  it('should register dependencies and resolve the tree', async done => {
    const foo = jest.fn();
    const fooResolved = jest.fn();
    const bar = jest.fn();
    const barResolved = jest.fn();    
    const baz = jest.fn();
    const bazResolved = jest.fn();
    const fuzz = jest.fn();
    const fuzzResolved = jest.fn();
    
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
    expect(fooResolved).toBeCalled();
    expect(barResolved).toBeCalled();
    expect(bazResolved).toBeCalled();
    expect(fuzzResolved).toBeCalled();
    done();
  });
});
