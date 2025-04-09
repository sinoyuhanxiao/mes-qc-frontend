import api from "./api";

const BASE_URL = "/shift-forms";

/**
 * Assign multiple forms to a single shift.
 * @param {number} shiftId - The ID of the shift.
 * @param {Array<string>} formIds - The IDs of the forms to assign.
 * @returns {Promise} API response with success or failure status.
 */
export const assignFormsToShift = (shiftId, formIds) => {
    return api.post(`${BASE_URL}/shifts/${shiftId}/forms`, formIds);
};

/**
 * Remove multiple forms from a specific shift.
 * @param {number} shiftId - The ID of the shift.
 * @param {Array<string>} formIds - The IDs of the forms to remove.
 * @returns {Promise} API response with success or failure status.
 */
export const removeFormsFromShift = (shiftId, formIds) => {
    return api.delete(`${BASE_URL}/shifts/${shiftId}/forms/`, {
        data: formIds,
    });
};

/**
 * Remove all forms from a specific shift.
 * @param {number} shiftId - The ID of the shift.
 * @returns {Promise} API response with success or failure status.
 */
export const removeAllFormsFromShift = (shiftId) => {
    return api.delete(`${BASE_URL}/shifts/${shiftId}/forms`);
};

/**
 * Retrieve all form IDs assigned to a specific shift.
 * @param {number} shiftId - The ID of the shift.
 * @returns {Promise} API response with the list of form IDs.
 */
export const getFormIdsForShift = (shiftId) => {
    return api.get(`${BASE_URL}/shifts/${shiftId}/forms`);
};

/**
 * Retrieve filtered form tree assigned to a specific shift.
 * This returns a tree structure where only the forms tied to the shift are included.
 * @param {number} shiftId - The ID of the shift.
 * @returns {Promise} API response with the filtered form tree.
 */
export const getFormTreeByShift = (shiftId) => {
    return api.get(`${BASE_URL}/shifts/${shiftId}/form-tree`);
};