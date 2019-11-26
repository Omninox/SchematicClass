const { Schema, model } = require('mongoose');
const { inherits: nativelyInherits } = require('util');

const { instanceOf } = require('./utils');

const restrictedProperties = [ 'caller', 'arguments', 'constructor', 'apply', 'call', 'bind' ];
const requiredSchematicClassStatics = [ '__context' ];
const optionalSchematicClassStatics = [ '__pre', '__post', '__schemaOptions', '__virtuals', '__queryHelpers', '__query', '__inherits', '__schema' ];
const ignoredSchematicClassStatics = [ 'prototype', 'name', 'length' ].concat(requiredSchematicClassStatics, optionalSchematicClassStatics);

exports.buildSchema = function buildSchema(Class) {
  if (!Class.hasOwnProperty('__context')) {
    throw new Error('Class must have a static context attribute.  Cannot convert to a Schema.');
  }

  Class.__class = Class;
  Class.prototype.__class = Class;

  Class.isInstanceOf = (obj) => {
    return instanceOf(obj, Class);
  };

  if (!Class.hasOwnProperty('__inherits')) {
    const Super = Object.getPrototypeOf(Class.prototype).constructor;

    if (Super.hasOwnProperty('__context')) {
      exports.inherits(Class, Super, false);
    }
  }

  const { context, instanceMethods, preHooks, postHooks, virtuals, foreignKeys, queryHelpers } = navigateInheritanceChain(Class);

  if (Class.hasOwnProperty('__inherits')) {
    Class.super = Class.__inherits.prototype;
  }

  const schema = new Schema(context, Class.__schemaOptions);

  setStaticMembers(schema, Class);
  setPreHooks(schema, preHooks);
  setPostHooks(schema, postHooks);
  setVirtuals(schema, virtuals);
  setForeignKeys(schema, foreignKeys);
  setQueryHelpers(schema, queryHelpers);
  setInstanceMethods(schema, instanceMethods);

  Class.__schema = schema;

  return schema;
}

exports.inherits = function inherits(Sub, Super, inheritNatively = true) {
  if (Sub.hasOwnProperty('__inherits')) {
    throw new Error('Subclass is already inheriting a superclass.  Multiple inheritance is not supported.');
  }

  if (!Super.hasOwnProperty('__context')) {
    throw new Error('Superclass must be a SchematicClass.');
  }

  if (!Sub.hasOwnProperty('__context')) {
    throw new Error('Subclass must be a SchematicClass.');
  }

  if (inheritNatively) {
    nativelyInherits(Sub, Super);
  }

  Sub.__inherits = Super;
}

exports.createModel = function createModel(SchematicClass, modelName) {
  if (!SchematicClass.hasOwnProperty('__schema')) {
    exports.buildSchema(SchematicClass);
  }

  const name = modelName || SchematicClass.name;

  if (!SchematicClass.hasOwnProperty('__inherits')) {
    SchematicClass.__model = model(name, SchematicClass.__schema);

    return SchematicClass.__model;
  }

  let rootClass = SchematicClass.__inherits;
  while (rootClass.hasOwnProperty('__inherits')) {
    rootClass = rootClass.__inherits;
  }

  if (!rootClass || !rootClass.__model) {
    throw new Error('Model must be created for root class before creating a model for the subclass.');
  }

  SchematicClass.__model = rootClass.__model.discriminator(name, SchematicClass.__schema);

  return SchematicClass.__model;
}

function navigateInheritanceChain(Class, originalClass = true) {
  if (!Class) {
    return {
      context:         {},
      preHooks:        {},
      postHooks:       {},
      virtuals:        {},
      foreignKeys:     {},
      queryHelpers:    {},
      instanceMethods: {},
    };
  }

  const result = navigateInheritanceChain(Class.__inherits, false);

  // Pre and post hooks are special.  Mongoose will automatically add the root class's
  // middleware to the its discriminators.  If we try to add the root class's
  // discriminators, they'll be executed twice.  To avoid this, we only add middleware
  // if we're operating on a root class originally or if the current Class is not the
  // root class on the original Class's inheritance chain.
  // Examples
  // A: Root (Include)
  // B: Root (Exclude) -> Subclass (Include)
  // C: Root (Exclude) -> Grandparent (Include) -> Parent (Include) -> Child (Include)
  if (Class.hasOwnProperty('__pre') && (originalClass || Class.hasOwnProperty('__inherits'))) {
    const hooks = Object.keys(Class.__pre);

    hooks.forEach((hookName) => {
      if (!result.preHooks[hookName]) {
        result.preHooks[hookName] = [];
      }

      result.preHooks[hookName] = result.preHooks[hookName].concat(Class.__pre[hookName]);
    });
  }

  if (Class.hasOwnProperty('__post') && (originalClass || Class.hasOwnProperty('__inherits'))) {
    const hooks = Object.keys(Class.__post);

    hooks.forEach((hookName) => {
      if (!result.postHooks[hookName]) {
        result.postHooks[hookName] = [];
      }

      result.postHooks[hookName] = result.postHooks[hookName].concat(Class.__post[hookName]);
    });
  }

  result.context = { ...result.context, ...Class.__context };
  result.foreignKeys = { ...result.foreignKeys, ...(Class.__foreignKeys || {}) };
  result.queryHelpers = { ...result.queryHelpers, ...(Class.__queryHelpers || {}) };

  // This may become a problem if people want to override just the getter or setter for the
  // virtual, but I'm going to hold off until I get a feature request on implementing that.
  // Mainly because virtuals are not the suggested way of doing things using SchematicClass.
  result.virtuals = { ...result.virtuals, ...(Class.__virtuals || {}) };

  const prototype = Class.__class ? Class.__class.prototype : Class.prototype;

  Object.getOwnPropertyNames(prototype).forEach((methodName) => {
    if (restrictedProperties.includes(methodName)) {
      return;
    }

    if (typeof prototype[methodName] !== 'function') {
      return;
    }

    result.instanceMethods[methodName] = prototype[methodName];
  });

  return result;
}

function setStaticMembers(schema, Class) {
  schema.statics = {};

  Object.getOwnPropertyNames(Class).forEach((staticMember) => {
    if (ignoredSchematicClassStatics.includes(staticMember)) {
      return;
    }

    schema.statics[staticMember] = Class[staticMember];
  });
}

function setInstanceMethods(schema, instanceMethods) {
  schema.methods = instanceMethods;
}

function setPreHooks(schema, preHooks) {
  const addHook = (eventName, hook) => {
    if (typeof hook === 'function') {
      schema.pre(eventName, hook);
    } else {
      schema.pre(eventName, hook.parallel, hook.middleware);
    }
  };

  Object.keys(preHooks).forEach((eventName) => {
    if (Array.isArray(preHooks[eventName])) {
      preHooks[eventName].forEach((preHook) => {
        addHook(eventName, preHook);
      });
    } else {
      addHook(eventName, preHooks[eventName]);
    }
  });
}

function setPostHooks(schema, postHooks) {
  const addHook = (eventName, hook) => {
    if (typeof hook === 'function') {
      schema.post(eventName, hook);
    } else {
      schema.post(eventName, hook.parallel, hook.middleware);
    }
  };

  Object.keys(postHooks).forEach((eventName) => {
    if (Array.isArray(postHooks[eventName])) {
      postHooks[eventName].forEach((postHook) => {
        addHook(eventName, postHook);
      });
    } else {
      addHook(eventName, postHooks[eventName]);
    }
  });
}

function setVirtuals(schema, virtuals) {
  Object.keys(virtuals).forEach((virtualName) => {
    const virtual = schema.virtual(virtualName);

    if (virtuals[virtualName].get) {
      virtual.get(virtuals[virtualName].get);
    }

    if (virtuals[virtualName].set) {
      virtual.set(virtuals[virtualName].set);
    }
  });
}

function setForeignKeys(schema, foreignKeys) {
  Object.keys(foreignKeys).forEach((key) => {
    schema.virtual(key, foreignKeys[key]);
  });
}

function setQueryHelpers(schema, queryHelpers) {
  schema.query = queryHelpers;
}