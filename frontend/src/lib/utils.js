// Utility functions for className management and general utilities

/**
 * Combine multiple class names into a single string
 * Filters out falsy values (null, undefined, false, '')
 * @param {...any} classes - Class names or conditions
 * @returns {string} - Combined class string
 */
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Merge multiple class objects
 * @param {...Object} classObjects - Objects with className keys
 * @returns {Object} - Merged class object
 */
export function mergeClasses(...classObjects) {
  return Object.assign({}, ...classObjects);
}
