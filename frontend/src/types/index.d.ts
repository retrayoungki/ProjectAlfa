/**
 * JSDoc Type Definitions for PRO MAN
 * These types serve as documentation and can be used for IDE autocompletion.
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} username - User's display name
 * @property {string} email - User's email
 * @property {string} role - System role (e.g., 'Admin', 'Director', 'Senior Project Manager')
 * @property {string} status - Account status ('Active', 'Inactive')
 */

/**
 * @typedef {Object} Project
 * @property {number|string} id - Project identifier
 * @property {string} name - Project name
 * @property {string} code - Project code (e.g., 'PRJ-2024-001')
 * @property {string} status - Current status ('On Track', 'At Risk', 'Delayed')
 * @property {number} progress - Progress percentage (0-100)
 */
