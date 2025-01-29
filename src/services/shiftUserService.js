import api from "./api";

const BASE_URL = "/shift-users";

/**
 * Assign a single user to multiple shifts.
 * @param {number} userId - The ID of the user.
 * @param {Array<number>} shiftIds - The IDs of the shifts to assign.
 * @returns {Promise} API response with success or failure status.
 */
export const assignUserToShifts = (userId, shiftIds) => {
    return api.post(`${BASE_URL}/users/${userId}/shifts`, shiftIds);
};

/**
 * Assign multiple users to a single shift.
 * @param {number} shiftId - The ID of the shift.
 * @param {Array<number>} userIds - The IDs of the users to assign.
 * @returns {Promise} API response with success or failure status.
 */
export const assignUsersToShift = (shiftId, userIds) => {
    return api.post(`${BASE_URL}/shifts/${shiftId}/users`, userIds);
};

/**
 * Remove a user from a specific shift.
 * @param {number} userId - The ID of the user.
 * @param {number} shiftId - The ID of the shift.
 * @returns {Promise} API response with success or failure status.
 */
export const removeUserFromShift = (userId, shiftId) => {
    return api.delete(`${BASE_URL}/users/${userId}/shifts/${shiftId}`);
};

/**
 * Remove a user from all shifts.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with success or failure status.
 */
export const removeUserFromAllShifts = (userId) => {
    return api.delete(`${BASE_URL}/users/${userId}/shifts`);
};

/**
 * Remove multiple users from a specific shift.
 * @param {number} shiftId - The ID of the shift.
 * @param {Array<number>} userIds - The IDs of the users to remove.
 * @returns {Promise} API response with success or failure status.
 */
export const removeUsersFromShift = (shiftId, userIds) => {
    return api.delete(`${BASE_URL}/shifts/${shiftId}/users`, {
        data: userIds,
    });
};

/**
 * Retrieve all shifts assigned to a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with the list of shifts.
 */
export const getShiftsForUser = (userId) => {
    return api.get(`${BASE_URL}/users/${userId}/shifts`);
};

/**
 * Retrieve all users assigned to a specific shift.
 * @param {number} shiftId - The ID of the shift.
 * @returns {Promise} API response with the list of users.
 */
export const getUsersForShift = (shiftId) => {
    return api.get(`${BASE_URL}/shifts/${shiftId}/users`);
};

/**
 * Retrieve all shift-user relationships.
 * @returns {Promise} API response with all shift-user relationships.
 */
export const getAllShiftUsers = () => {
    return api.get(`${BASE_URL}`);
};
