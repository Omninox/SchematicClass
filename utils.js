/**
 * Returns whether or not object is an instance of Constructor.
 *
 * @param {any} obj - the Object to test against Constructor
 * @param {any} Constructor (Function) - the potential constructor for `obj`
 *
 * @return {boolean} true iff object is an instance of Constructor
 */
exports.instanceOf = function instanceOf(obj, Constructor) {
  if (!obj || !obj.__class || !Constructor) {
    return false;
  }

  return !!(
    obj instanceof Constructor ||
    obj instanceof Constructor.__class ||
    obj.__class === Constructor.__class ||
    obj.__class.prototype instanceof Constructor.__class ||
    (
      obj.__class.__inherits &&
      instanceOf(obj.__class.__inherits.prototype, Constructor)
    )
  );
}