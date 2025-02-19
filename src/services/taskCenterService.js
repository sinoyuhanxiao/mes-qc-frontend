// src/services/taskCenterService.js
import api from './api';
import qs from 'qs';

const BASE_URL = '/dispatched-tasks';

/**
 * Fetch tasks assigned to a user for today.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with today's tasks.
 */
export const fetchTodayTasks = (userId) => {
    return api.get(`${BASE_URL}/today`, {
        params: { userId },
    });
};

/**
 * Fetch future tasks assigned to a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with future tasks.
 */
export const fetchFutureTasks = (userId) => {
    return api.get(`${BASE_URL}/future`, {
        params: { userId },
    });
};

/**
 * Fetch historical tasks assigned to a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with historical tasks.
 */
export const fetchHistoricalTasks = (userId) => {
    return api.get(`${BASE_URL}/history`, {
        params: { userId },
    });
};

/**
 * Fetch overdue tasks assigned to a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with overdue tasks.
 */
export const fetchOverdueTasks = (userId) => {
    return api.get(`${BASE_URL}/overdue`, {
        params: { userId },
    });
};

/**
 * Insert multiple dispatched tasks based on user IDs.
 * @param {Object} task - The dispatched task details.
 * @param {Array<number>} userIds - List of user IDs.
 * @returns {Promise} API response.
 */
export const insertDispatchedTasks = (task, userIds) => {
    return api.post('/dispatched-tasks/insert', task, {
        params: { userIds: userIds.join(',') }, // Format as a comma-separated string
    });
};

/**
 * Update a dispatched task by its ID.
 * @param {number} id - The ID of the dispatched task.
 * @param {Object} updatedTask - The updated task details.
 * @returns {Promise} API response.
 */
export const updateDispatchedTask = (id, updatedTask) => {
    return api.put(`${BASE_URL}/update/${id}`, updatedTask);
};

/**
 * Get a dispatched task by its ID.
 * @param {number} id - The ID of the dispatched task.
 * @returns {Promise} API response with the task details.
 */
export const fetchTaskById = (id) => {
    return api.get(`${BASE_URL}/get/${id}`);
};

/**
 * Soft delete a dispatched task by its ID.
 * @param {number} id - The ID of the dispatched task.
 * @returns {Promise} API response.
 */
export const deleteDispatchedTask = (id) => {
    return api.delete(`${BASE_URL}/delete/${id}`);
};

/**
 * Get paginated dispatched tasks with optional search filtering.
 * @param {number} page - The page number (default: 1). Adjusted for Spring Boot (0-based index).
 * @param {number} pageSize - The number of tasks per page (default: 50).
 * @param {string} sort - Sorting criteria, e.g., "dispatch_time,desc" (default: "dispatch_time,desc").
 * @param {string} [search] - Optional search query to filter results.
 * @returns {Promise} API response with the paginated dispatched tasks.
 */
export const getAllDispatchedTasks = (page = 1, pageSize = 50, sort = "dispatch_time,desc", search = "") => {
    return api.get(`${BASE_URL}`, {
        params: {
            page: page - 1, // Adjusting for Spring Boot's 0-based pagination
            size: pageSize,
            sort: sort,
            ...(search && { search }) // Include search only if provided
        }
    });
};

/**
 * Get paginated dispatched tasks filtered by dispatch ID with optional search filtering.
 * @param {number} dispatchId - The ID of the dispatch.
 * @param {number} page - The page number (default: 1).
 * @param {number} pageSize - The number of tasks per page (default: 50).
 * @param {string} sort - Sorting criteria, e.g., "dispatch_time,desc" (default: "dispatch_time,desc").
 * @param {string} [search] - Optional search query to filter results.
 * @returns {Promise} API response with the filtered paginated dispatched tasks.
 */
export const getAllDispatchedTasksByDispatchId = (dispatchId, page = 1, pageSize = 50, sort = "dispatch_time,desc", search = "") => {
    return api.get(`${BASE_URL}/by-dispatch`, {
        params: {
            dispatchId: dispatchId,
            page: page - 1, // Adjusting for Spring Boot's 0-based pagination
            size: pageSize,
            sort: sort,
            ...(search && { search }) // Include search only if provided
        }
    });
};


