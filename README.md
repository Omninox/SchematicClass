[![codecov](https://codecov.io/gh/Omninox/SchematicClass/branch/master/graph/badge.svg)](https://codecov.io/gh/Omninox/SchematicClass) [![CircleCI](https://circleci.com/gh/Omninox/SchematicClass.svg?style=svg)](https://circleci.com/gh/Omninox/SchematicClass)

# SchematicClass
SchematicClass is a way to build your mongoose schemas and models using native classes.  Additionally, SchematicClass extends mongoose's native discriminators to support multilevel discriminators (inheritance).

## Installation
npm
```shell
npm install --save mongo-schematic-class
```

yarn
```shell
yarn add mongo-schematic-class
```

## Features

- [x] Full support of mongoose's native features
- [x] Multilevel discriminators

## Example Usage

```javascript
const { createModel } = require('mongo-schematic-class');

class Vehicle {
  // Define the structure of the Schema.
  static get __context() {
    return {
      vin:  {
        type:     String,
        required: true,
        unique:   true,
      },
      milesTraveled: {
        type:     Number,
        default:  0,
      }
    };
  }

  // This instance method will be added to the Schema and be inherited by all subclasses.
  drive(miles) {
    this.milesTraveled += miles;
  }
}

// Create the Vehicle model.
createModel(Vehicle);

class GasVehicle extends Vehicle {
  // Define the structure of the Schema.
  static get __context() {
    return {
      tankSize: {
        type:     Number,
        required: true,
      },
      mpg:      {
        type:     Number,
        required: true,
      },
    }
  }

  // Define the virtuals that should be added to the Schema.  These are not suggested,
  // but supported for backwards compatibility.
  static get __virtuals() {
    return {
      drivingRange: {
        get:  function getDrivingRange() {
          return (this.tankSize * this.mpg);
        },
      },
    };
  }

  // If you define a virtual on the Schema, you should define a similar one on the class.
  get drivingRange() {
    return (this.tankSize * this.mpg);
  }
}

// Create the GasVehicle model.
createModel(GasVehicle);
```

## API

### `createModel(Class: SchematicClass, modelName?: string): Model`
Creates a Model for the specified SchematicClass.  This is the only method that has to be called on the SchematicClass.

#### Arguments
| Type | Description|
|------|------------|
| `SchematicClass` | The SchematicClass for which the Model should be created. |
| `string` | _Optional_. The name of the Model.  If omitted, the name of the SchematicClass is used. |

## How to define a SchematicClass
SchematicClass works by looking at static properties on the provided class to build the mongoose schema.  The following properties are supported:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `__context` | `{ [ propertyName: string ]: any }` | `true` | This is effectively the schema for your class.  You'll define all of the instance properties on your class as well as their type. Any mongoose supported type is supported. |
| `__pre` | `{ [ eventName: string ]: (...args: any[]) => any }` | `false` |  The prehooks to define on the schema. |
| `__post` | `{ [ eventName: string ]: (...args: any[]) => any }` | `false` |  The posthooks to define on the schema. |
| `__virtuals` | `{ [ virtualName: string ]: { get?: () => any, set?: (val: any) => void } }` | `false` |  The virtuals to define for this class.  Virtuals are generally discouraged when using SchematicClass as it requires duplication of code (you must define a getter and setter twice, once for the Model and once for the class).  Instead, you can use an instance method to get a similar effect. |
| `__foreignKeys` | <code>{ [ foreignKeyName: string ]: { ref: string &#124; Model, localField: string &#124; (() => string), foreignField: string &#124; (() => string), justOne?: boolean, count?: boolean } }</code> | `false` |  Foreign keys to define on the schema.  Foreign keys in mongoose can be used to populate documents based on values other than the `_id` field.  See the mongoose documentation for further information. |
| `__queryHelpers` | `{ [ queryName: string ]: (this: Model, ...args: any[]) => DocumentQuery }` | `false` | Defines a mongoose query helper on the schema. |

## Inheritable Properties
One of the main benefits of mongo-schematic-class is the support for multilevel discriminators (inheritance).  The following properties defined on a SchematicClass are inheritable:

- Instance Properties (`__context`)
- *Middleware (`__pre` & `__post`)
- Virtuals (`__virtuals`)
- Foreign Keys (`__foreignKeys`)
- Query Helpers (`__queryHelpers`)
- Instance Methods

*Unlike other inheritable properties, middleware cannot be overridden.  If you define a pre hook on your superclass and the same pre hook on the subclass, both pre hooks will be executed.

## Static Properties Added to SchematicClasses (and Their Schemas)
While building the schema and creating the model, mongo-schematic-class will add the following static properties to your SchematicClass.

- `__schema` - This is the schema generated when you execute `buildSchema()` or `createModel()`
- `__model` - This is the model created when you execute `createModel()`
- `__inherits` - This is the SchematicClass's parent class.  This is added when you call `inherits()` or `createModel()`.
- `isInstanceOf()` - This is a helper method that should be used in place of the `instanceof` operator when trying to determine if an object is an instance of a SchematicClass.  This works for both instances of the Model and instances of the actual SchematicClass.  `isInstanceOf()` will follow the inheritance chain.

## Advanced API

### `buildSchema(Class: SchematicClass)`
Builds the Mongoose schema as configured on the SchematicClass.  After running this, the `__schema` property will be added to `Class`.

#### Arguments
| Type | Description|
|------|------------|
| `SchematicClass` | The SchematicClass for which a schema should be built. |

#### Return Value
| Type | Description|
|------|------------|
| `Model` | The model created for Class. |

### `inherits(Subclass: SchematicClass, Superclass: SchematicClass)`
Instructs mongo-schematic-class that Subclass inherits from Superclass.  Both Subclass and Superclass must be a SchematicClass.  If this method is not called when inheriting a Superclass, `buildSchema()` will automatically detect that Subclass inherits from Superclass and call this method.

After calling this, the `__inherits` property will be added to `Subclass`.

#### Arguments
| Type | Description|
|------|------------|
| `SchematicClass` | The subclass inheriting from Superclass |
| `SchematicClass` | The superclass from which subclass inherits. |