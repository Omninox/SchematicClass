import { SchematicClass } from '.';
import { Model } from 'mongoose';

export function instanceOf(obj: any, Constructor: SchematicClass<any, any, any> | Model<any, any>);