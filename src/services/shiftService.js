import api from "./api";

const BASE_URL = "/shifts";

/**
 * Fetch all shifts.
 * @returns {Promise} API response with the list of all shifts.
 */
export const getAllShifts = () => {
    return api.get(`${BASE_URL}`);
};

/**
 * Fetch a specific shift by ID.
 * @param {number} id - The ID of the shift.
 * @returns {Promise} API response with the shift details.
 */
export const getShiftById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

/**
 * Create a new shift.
 * @param {Object} shiftData - The data for creating a new shift.
 * @param {number} createdBy - The ID of the user creating the shift.
 * @returns {Promise} API response with the created shift details.
 */
export const createShift = (shiftData, createdBy) => {
    return api.post(`${BASE_URL}?createdBy=${createdBy}`, shiftData);
};

/**
 * Update an existing shift.
 * @param {number} id - The ID of the shift to update.
 * @param {Object} shiftData - The updated data for the shift.
 * @param updatedBy
 * @returns {Promise} API response with the updated shift details.
 */
export const updateShift = (id, shiftData, updatedBy) => {
    return api.put(`${BASE_URL}/${id}?updatedBy=${updatedBy}`, shiftData);
};

/**
 * Deactivate a shift (soft delete).
 * @param {number} id - The ID of the shift to deactivate.
 * @param {number} updatedBy - The ID of the user performing the action.
 * @returns {Promise} API response with success or failure status.
 */
export const deactivateShift = (id, updatedBy) => {
    return api.put(`${BASE_URL}/deactivate/${id}?updatedBy=${updatedBy}`);
};

/**
 * Activate an inactive shift.
 * @param {number} id - The ID of the shift to activate.
 * @param {number} updatedBy - The ID of the user performing the action.
 * @returns {Promise} API response with success or failure status.
 */
export const activateShift = (id, updatedBy) => {
    return api.put(`${BASE_URL}/activate/${id}?updatedBy=${updatedBy}`);
};

/**
 * Hard delete a shift.
 * @param {number} id - The ID of the shift to delete.
 * @returns {Promise} API response with success or failure status.
 */
export const deleteShift = (id) => {
    return api.delete(`${BASE_URL}/delete/${id}`);
};
