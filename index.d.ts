import { Schema, SchemaOptions, Model } from "mongoose";

export type Hook = (( ...args: any[] ) => any) | (( ...args: any[] ) => Promise<any>) | { parallel: boolean, middleware: ((...args: any[]) => any) | ((...args: any[]) => Promise<any>) };
export type Hooks = { [ eventName: string ]: Hook };

export type Virtual<T = any> = {
  get?: () => T,
  set?: (_: T) => void,
};
export type Virtuals = { [ virtualName: string ]: Virtual }

export type ForeignKey = {
  ref:          string | Model<any, any>,
  localField:   string | (() => string),
  foreignField: string | (() => string),
  justOne?:     boolean | (() => boolean),
  count?:       boolean,
};
export type ForeignKeys = { [ foreignKeyName: string ]: ForeignKey };

export type QueryHelper<DocType extends Document, ReturnType, QueryHelpersType> = (this: Model<DocType, QueryHelpersType>, ...args: any[]) => DocumentQuery<ReturnType, DocType, QueryHelpersType>;
export type QueryHelpers<DocType extends Document, ReturnType, QueryHelpersType> = { [ queryName: string ]: QueryHelper<DocType, ReturnType, QueryHelpersType> };

export type SchematicClassInstance = {
  __class:  SchematicClass,
};

export type SchematicClass<IQueryHelpers, DocType, QueryReturnType = any> = {
  __context:        {
    [ fieldName: string ]:  SchemaType,
  },
  __schemaOptions?: SchemaOptions,

  __pre?:           Hooks,
  __post?:          Hooks,
  __virtuals?:      Virtuals,
  __query?:         QueryHelpers<IQueryHelpers, DocType, QueryReturnType>,
  __queryHelpers?:  QueryHelpers<IQueryHelpers, DocType, QueryReturnType>,

  super?:           SchematicClassInstance,
  __schema:         Schema,
  __model:          Model<DocType, IQueryHelpers>,
  __class:          SchematicClass,
  prototype:        SchematicClassInstance,
  __inherits?:      SchematicClass,

  isInstanceOf:   (obj: SchematicClass<any> | any) => boolean,
};

export function buildSchema(Class: SchematicClass): Schema;
export function inherits(Sub: SchematicClass, Super: SchematicClass): void;
export function createModel<DocType extends Document, QueryHelpersType>(SchematicClass: SchematicClass, name?: string): Model<DocType, QueryHelpersType>;