const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Sinon = require('sinon');
const should = require('should');

describe('SchematicClass', () => {
  describe('buildSchema', () => {
    const buildSchema = require('../index').buildSchema;

    it('should add static methods to the schema', () => {
      class Test {
        static get __context() {
          return {};
        }

        static aStaticMethod() {}
      }

      buildSchema(Test);

      should.exist(Test.__schema);
      should.exist(Test.__schema.statics);
      Test.__schema.statics.should.have.property('aStaticMethod');
      Object.get
    });

    it('should add instance methods to the schema', () => {
      class Test {
        static get __context() {
          return {};
        }

        anInstanceMethod() {}
      }

      buildSchema(Test);

      should.exist(Test.__schema);
      should.exist(Test.__schema.methods);
      Test.__schema.methods.should.have.property('anInstanceMethod');
    });

    it('should add query helpers to the schema', () => {
      class SchematicClass {
        static get __context() {
          return {};
        }

        static get __queryHelpers() {
          return {
            findByEnemy() {}
          };
        }
      }

      buildSchema(SchematicClass);

      should.exist(SchematicClass.__schema);
      should.exist(SchematicClass.__schema.query);
      SchematicClass.__schema.query.should.have.property('findByEnemy');
    });

    it('should not inherit static methods', () => {
      class Superclass {
        static get __context() {
          return {};
        }

        static parentStaticMethod() {}
      }

      class Subclass {
        static get __context() {
          return {};
        }

        static get __inherits() {
          return Superclass;
        }
      }

      buildSchema(Subclass);

      should.exist(Subclass.__schema);
      should.exist(Subclass.__schema.statics);
      Subclass.__schema.statics.should.not.have.property('parentStaticMethod');
    });

    it('should inherit instance methods', () => {
      class Superclass {
        static get __context() {
          return {};
        }

        parentInstanceMethod() {}
      }

      class Subclass {
        static get __context() {
          return {};
        }

        static get __inherits() {
          return Superclass;
        }
      }

      buildSchema(Subclass);

      should.exist(Subclass.__schema);
      should.exist(Subclass.__schema.methods);
      Subclass.__schema.methods.should.have.property('parentInstanceMethod');
    });

    it('should inherit query helpers', () => {
      class Superclass {
        static get __context() {
          return {};
        }

        static get __queryHelpers() {
          return {
            findByEnemy() {}
          };
        }
      }

      class Subclass {
        static get __context() {
          return {};
        }

        static get __inherits() {
          return Superclass;
        }
      }

      buildSchema(Subclass);

      should.exist(Subclass.__schema);
      should.exist(Subclass.__schema.query);
      Subclass.__schema.query.should.have.property('findByEnemy');
    });

    describe('', () => {
      let Schema;
      let virtualInstance;

      let buildSchema;

      beforeEach(() => {
        virtualInstance = {
          get: Sinon.stub(),
          set: Sinon.stub(),
        };

        Schema = Sinon.stub();
        Schema.prototype.pre = Sinon.stub();
        Schema.prototype.post = Sinon.stub();
        Schema.prototype.virtual = Sinon.stub().returns(virtualInstance);

        buildSchema = proxyquire('../', {
          mongoose: { Schema },
        }).buildSchema;
      });

      it('should add pre-hooks to the schema', () => {
        class Test {
          static get __context() {
            return {};
          }

          static get __pre() {
            return {
              save: () => {},
            };
          }
        }

        buildSchema(Test);

        Sinon.assert.calledOnce(Schema.prototype.pre);
        Sinon.assert.calledWith(Schema.prototype.pre, 'save', Sinon.match.func);
      });

      it('should handle an array of pre hooks', () => {
        class Test {
          static get __context() {
            return {};
          }

          static get __pre() {
            return {
              save: [ () => {}, () => {} ],
            };
          }
        }

        buildSchema(Test);

        Sinon.assert.calledTwice(Schema.prototype.pre);
        Sinon.assert.alwaysCalledWith(Schema.prototype.pre, 'save', Sinon.match.func);
      });

      it('should add post-hooks to the schema', () => {
        class Test {
          static get __context() {
            return {};
          }

          static get __post() {
            return {
              save: () => {},
            };
          }
        }

        buildSchema(Test);

        Sinon.assert.calledOnce(Schema.prototype.post);
        Sinon.assert.calledWith(Schema.prototype.post, 'save', Sinon.match.func);
      });

      it('should handle an array of post hooks', () => {
        class Test {
          static get __context() {
            return {};
          }

          static get __post() {
            return {
              save: [ () => {}, () => {} ],
            };
          }
        }

        buildSchema(Test);

        Sinon.assert.calledTwice(Schema.prototype.post);
        Sinon.assert.alwaysCalledWith(Schema.prototype.post, 'save', Sinon.match.func);
      });

      it('should add getter virtuals to the schema', () => {
        const get = () => true;

        class Test {
          static get __context() {
            return {};
          }

          static get __virtuals() {
            return {
              isTest: {
                get,
              },
            };
          }

          get isTest() {
            return true;
          }
        }

        buildSchema(Test);

        Sinon.assert.calledOnce(Schema.prototype.virtual);
        Sinon.assert.calledWith(Schema.prototype.virtual, 'isTest');

        Sinon.assert.calledOnce(virtualInstance.get);
        Sinon.assert.calledWith(virtualInstance.get, get);
      });

      it('should add setter virtuals to the schema', () => {
        const set = (_val) => { };

        class Test {
          static get __context() {
            return {};
          }

          static get __virtuals() {
            return {
              isTest: {
                set,
              },
            };
          }

          set isTest(_val) { }
        }

        buildSchema(Test);

        Sinon.assert.calledOnce(Schema.prototype.virtual);
        Sinon.assert.calledWith(Schema.prototype.virtual, 'isTest');

        Sinon.assert.calledOnce(virtualInstance.set);
        Sinon.assert.calledWith(virtualInstance.set, set);
      });

      it('should add getter/setter virtuals to the schema', () => {
        const get = () => true;
        const set = (_val) => { };

        class Test {
          static get __context() {
            return {};
          }

          static get __virtuals() {
            return {
              isTest: {
                get,
                set,
              },
            };
          }

          get isTest() {
            return true;
          }

          set isTest(_val) { }
        }

        buildSchema(Test);

        Sinon.assert.calledOnce(Schema.prototype.virtual);
        Sinon.assert.calledWith(Schema.prototype.virtual, 'isTest');

        Sinon.assert.calledOnce(virtualInstance.get);
        Sinon.assert.calledWith(virtualInstance.get, get);

        Sinon.assert.calledOnce(virtualInstance.set);
        Sinon.assert.calledWith(virtualInstance.set, set);
      });

      it('should add foreign keys to the schema', () => {
        const foreignKeyDefinition = {
          ref:          'AnotherSchematicClass',
          localField:   'another',
          foreignField: 'sid',
          justOne:      true,
        };

        class Test {
          static get __context() {
            return {
              another: {
                type:     String,
                required: true,
              },
            };
          }

          static get __foreignKeys() {
            return {
              myForeignKey: foreignKeyDefinition,
            };
          }
        }

        buildSchema(Test);

        Sinon.assert.calledOnce(Schema.prototype.virtual);
        Sinon.assert.calledWith(Schema.prototype.virtual, 'myForeignKey', foreignKeyDefinition);
      });

      it('should inherit pre-hooks', () => {
        const preSave = () => {};

        class RootClass {
          static get __context() {
            return {};
          }

          static get __pre() {
            return {
              save: () => {},
            };
          }
        }

        class Superclass extends RootClass {
          static get __context() {
            return {};
          }

          static get __pre() {
            return {
              save: preSave,
            };
          }
        }

        class Subclass extends Superclass {
          static get __context() {
            return {};
          }
        }

        buildSchema(RootClass);
        buildSchema(Superclass);

        Schema.prototype.pre.resetHistory();

        buildSchema(Subclass);

        Sinon.assert.calledOnce(Schema.prototype.pre);
        Sinon.assert.calledWith(Schema.prototype.pre, 'save', preSave);
      });

      it('should not inherit pre-hooks from the root class', () => {
        const preSave = () => {};

        class Superclass {
          static get __context() {
            return {};
          }

          static get __pre() {
            return {
              save: preSave,
            };
          }
        }

        class Subclass extends Superclass {
          static get __context() {
            return {};
          }
        }

        buildSchema(Subclass);

        Sinon.assert.notCalled(Schema.prototype.pre);
      });

      it('should inherit post-hooks', () => {
        const postSave = () => {};

        class RootClass {
          static get __context() {
            return {};
          }

          static get __pre() {
            return {
              save: () => {},
            };
          }
        }

        class Superclass extends RootClass {
          static get __context() {
            return {};
          }

          static get __post() {
            return {
              save: postSave,
            };
          }
        }

        class Subclass extends Superclass {
          static get __context() {
            return {};
          }
        }

        buildSchema(RootClass);
        buildSchema(Superclass);

        Schema.prototype.post.resetHistory();

        buildSchema(Subclass);

        Sinon.assert.calledOnce(Schema.prototype.post);
        Sinon.assert.calledWith(Schema.prototype.post, 'save', postSave);
      });

      it('should not inherit post-hooks from the root class', () => {
        const postSave = () => {};

        class Superclass {
          static get __context() {
            return {};
          }

          static get __post() {
            return {
              save: postSave,
            };
          }
        }

        class Subclass extends Superclass {
          static get __context() {
            return {};
          }
        }

        buildSchema(Subclass);

        Sinon.assert.notCalled(Schema.prototype.post);
      });

      it('should inherit virtuals', () => {
        const get = () => {};

        class Superclass {
          static get __context() {
            return {};
          }

          static get __virtuals() {
            return {
              isTest: {
                get,
              },
            };
          }
        }

        class Subclass extends Superclass {
          static get __context() {
            return {};
          }
        }

        buildSchema(Superclass);
        Schema.prototype.virtual.resetHistory();
        virtualInstance.get.resetHistory();

        buildSchema(Subclass);

        Sinon.assert.calledOnce(Schema.prototype.virtual);
        Sinon.assert.calledWith(Schema.prototype.virtual, 'isTest');

        Sinon.assert.calledOnce(virtualInstance.get);
        Sinon.assert.calledWith(virtualInstance.get, get);
      });

      it('should inherit foreign keys', () => {
        const foreignKeyDefinition = {
          ref:          'AnotherSchematicClass',
          localField:   'another',
          foreignField: 'sid',
          justOne:      true,
        };

        class Superclass {
          static get __context() {
            return {};
          }

          static get __foreignKeys() {
            return {
              myForeignKey: foreignKeyDefinition,
            };
          }
        }

        class Subclass extends Superclass {
          static get __context() {
            return {};
          }
        }

        buildSchema(Superclass);
        Schema.prototype.virtual.resetHistory();

        buildSchema(Subclass);

        Sinon.assert.calledOnce(Schema.prototype.virtual);
        Sinon.assert.calledWith(Schema.prototype.virtual, 'myForeignKey', foreignKeyDefinition);
      });
    });
  });

  describe('inherits', () => {
    let Subclass;
    let Superclass;

    let inherits;

    beforeEach(() => {
      Subclass = function Subclass() {};
      Subclass.__context = {};

      Superclass = function Superclass() {};
      Superclass.__context = {};

      inherits = proxyquire('../index', {
        mongoose: {
          Schema: Sinon.stub(),
        },
      }).inherits;
    });

    it('should throw an error if the superclass is not a SchematicClass', () => {
      should.throws(() => {
        inherits(Subclass, function () {});
      }, 'Superclass must be a SchematicClass.');
    });

    it('should throw an error if the subclass is not a SchematicClass', () => {
      should.throws(() => {
        inherits(function () {}, Superclass);
      }, 'Subclass must be a SchematicClass.');
    });

    it('should throw an error if the subclass already inherits a superclass', () => {
      inherits(Subclass, Superclass);

      should.throws(() => {
        inherits(Subclass, Superclass);
      }, 'Subclass is already inheriting a superclass.  Multiple inheritance is not supported.');
    });

    it('should make the subclass inherit the superclass', () => {
      Superclass.prototype.shouldBeInherited = function shouldBeInherited() {};

      inherits(Subclass, Superclass);

      should.exist(Subclass.prototype.shouldBeInherited);
    });
  });

  describe('createModel', () => {
    let createModel;
    let model;

    beforeEach(() => {
      model = Sinon.stub();

      createModel = proxyquire('../index', {
        'mongoose': {
          Schema: {},
          model,
        }
      }).createModel;
    });

    it('should create a model', () => {
      const name = 'Test1';

      class SchematicClass {
        static get __context() {
          return {};
        }

        static get __schema() {
          return {};
        }
      }

      createModel(SchematicClass, name);

      Sinon.assert.calledOnce(model);
      Sinon.assert.calledWith(model, name, SchematicClass.__schema);
    });

    it('should follow the inheritance chain to create a discriminator', () => {
      const discriminator = Sinon.stub();
      const name = 'Child';

      const root = { __context: {}, __model: { discriminator } };
      const parent = { __context: {}, __inherits: root };
      const child = { __context: {}, __schema: {}, __inherits: parent };

      createModel(child, name);

      Sinon.assert.notCalled(model);
      Sinon.assert.calledOnce(discriminator);
      Sinon.assert.calledWith(discriminator, name, child.__schema);
    });

    it(`should create a model with the class name if one isn't provided`, () => {
      class SchematicTest {
        static get __context() {
          return {};
        }

        static get __schema() {
          return {};
        }
      }

      createModel(SchematicTest);

      Sinon.assert.calledOnce(model);
      Sinon.assert.calledWith(model, 'SchematicTest');
    });

    it(`should throw an error if the root class isn't a SchematicClass`, () => {
      const root = { __context: {} };
      const parent = { __context: {}, __inherits: root };
      const child = { __context: {}, __schema: {}, __inherits: parent };

      should.throws(() => {
        createModel(child, 'Child');
      }, 'Model must be created for root class before creating a model for the subclass.');
    });
  });
});