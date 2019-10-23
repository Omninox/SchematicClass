const { instanceOf } = require('../utils');

describe('utils', () => {
  describe('instanceOf', () => {
    it('should return false if obj is not defined', () => {
      instanceOf(null, class Test {}).should.equal(false);
    });

    it('should return false if Constructor is not defined', () => {
      instanceOf({}, null).should.equal(false);
    });

    it('should return false is obj is not an instance of a SchematicClass', () => {
      instanceOf({}, class Test {});
    });

    it('should return true if obj is an instance of Constructor', () => {
      class Test {
        constructor() {
          this.__class = Test;
        }
      }

      const test = new Test();

      instanceOf(test, Test).should.equal(true);
    });

    it('should return true if obj is an instance of Constructor.class', () => {
      class Test {
        constructor() {
          this.__class = Test;
        }
      }

      class TestConstructor {
        static get __class() {
          return Test;
        }
      }

      const test = new Test();

      instanceOf(test, TestConstructor).should.equal(true);
    });

    it(`should return true if obj's constructor inherits from Constructor`, () => {
      class TestConstructor {
        static get __class() {
          return TestConstructor;
        }
      }

      class Test extends TestConstructor {
        constructor() {
          super();

          this.__class = Test;
        }

        static get __inherits() {
          return TestConstructor;
        }
      }

      const test = new Test();

      instanceOf(test, TestConstructor).should.equal(true);
    });
  });
});