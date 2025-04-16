import api from "./api";

const BASE_URL = "/team-users";

/**
 * Assign a single user to multiple teams.
 * @param {number} userId - The ID of the user.
 * @param {Array<number>} teamIds - The IDs of the teams to assign.
 * @returns {Promise} API response with success or failure status.
 */
export const assignUserToTeams = (userId, teamIds) => {
    return api.post(`${BASE_URL}/users/${userId}/teams`, teamIds);
};

/**
 * Assign multiple users to a single team.
 * @param {number} teamId - The ID of the team.
 * @param {Array<number>} userIds - The IDs of the users to assign.
 * @returns {Promise} API response with success or failure status.
 */
export const assignUsersToTeam = (teamId, userIds) => {
    return api.post(`${BASE_URL}/teams/${teamId}/users`, userIds);
};

/**
 * Remove a user from a specific team.
 * @param {number} userId - The ID of the user.
 * @param {number} teamId - The ID of the team.
 * @returns {Promise} API response with success or failure status.
 */
export const removeUserFromTeam = (userId, teamId) => {
    return api.delete(`${BASE_URL}/users/${userId}/teams/${teamId}`);
};

/**
 * Remove a user from all teams.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with success or failure status.
 */
export const removeUserFromAllTeams = (userId) => {
    return api.delete(`${BASE_URL}/users/${userId}/teams`);
};

/**
 * Remove multiple users from a specific team.
 * @param {number} teamId - The ID of the team.
 * @param {Array<number>} userIds - The IDs of the users to remove.
 * @returns {Promise} API response with success or failure status.
 */
export const removeUsersFromTeam = (teamId, userIds) => {
    return api.delete(`${BASE_URL}/teams/${teamId}/users`, {
        data: userIds,
    });
};

/**
 * Remove all users from a specific team.
 * @param {number} teamId - The ID of the team.
 * @returns {Promise} API response with success or failure status.
 */
export const removeTeamFromAllUsers = (teamId) => {
    return api.delete(`${BASE_URL}/teams/${teamId}/users/all`);
};

/**
 * Retrieve all teams assigned to a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with the list of teams.
 */
export const getTeamsForUser = (userId) => {
    return api.get(`${BASE_URL}/users/${userId}/teams`);
};

/**
 * Retrieve all users assigned to a specific team.
 * @param {number} teamId - The ID of the team.
 * @returns {Promise} API response with the list of users.
 */
export const getUsersForTeam = (teamId) => {
    return api.get(`${BASE_URL}/teams/${teamId}/users`);
};

/**
 * Retrieve all team-user relationships.
 * @returns {Promise} API response with all team-user relationships.
 */
export const getAllTeamUsers = () => {
    return api.get(`${BASE_URL}`);
};
