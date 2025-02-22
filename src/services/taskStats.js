import api from './api';

const TASK_STATS_URL = '/task-stats';

/**
 * Fetch task statistics for a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with task statistics.
 */
export const fetchTaskStatistics = (userId) => {
    return api.get(TASK_STATS_URL, {
        params: { userId },
    });
};

/**
 * Fetch quarterly task statistics for a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} API response with quarterly task statistics.
 */
export const fetchQuarterlyTaskStatistics = (userId) => {
    return api.get(`${TASK_STATS_URL}/quarterly-stats`, {
        params: { userId },
    });
};
