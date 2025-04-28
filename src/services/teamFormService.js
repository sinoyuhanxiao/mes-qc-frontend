import api from "./api";

const BASE_URL = "/team-forms";

/**
 * Assign multiple forms to a single team.
 * @param {number} teamId - The ID of the team.
 * @param {Array<string>} formIds - The IDs of the forms to assign.
 * @returns {Promise} API response with success or failure status.
 */
export const assignFormsToTeam = (teamId, formIds) => {
    return api.post(`${BASE_URL}/teams/${teamId}/forms`, formIds);
};

/**
 * Remove multiple forms from a specific team.
 * @param {number} teamId - The ID of the team.
 * @param {Array<string>} formIds - The IDs of the forms to remove.
 * @returns {Promise} API response with success or failure status.
 */
export const removeFormsFromTeam = (teamId, formIds) => {
    return api.delete(`${BASE_URL}/teams/${teamId}/forms/`, {
        data: formIds,
    });
};

/**
 * Remove all forms from a specific team.
 * @param {number} teamId - The ID of the team.
 * @returns {Promise} API response with success or failure status.
 */
export const removeAllFormsFromTeam = (teamId) => {
    return api.delete(`${BASE_URL}/teams/${teamId}/forms`);
};

/**
 * Retrieve all form IDs assigned to a specific team.
 * @param {number} teamId - The ID of the team.
 * @returns {Promise} API response with the list of form IDs.
 */
export const getFormIdsForTeam = (teamId) => {
    return api.get(`${BASE_URL}/teams/${teamId}/forms`);
};

/**
 * Retrieve filtered form tree assigned to a specific team.
 * This returns a tree structure where only the forms tied to the team are included.
 * @param {number} teamId - The ID of the team.
 * @returns {Promise} API response with the filtered form tree.
 */
export const getFormTreeByTeam = (teamId) => {
    return api.get(`${BASE_URL}/teams/${teamId}/form-tree`);
};
