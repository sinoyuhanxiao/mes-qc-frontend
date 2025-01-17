// src/services/qcTaskSubmissionLogsService.js
import api from './api';

const BASE_URL = '/qc-task-submission-logs';

/**
 * Insert a new QC Task Submission Log into the backend.
 * @param {Object} logData - The log data to be inserted.
 * @returns {Promise} API response after inserting the log data.
 */
export const insertTaskSubmissionLog = (logData) => {
    return api.post(`${BASE_URL}`, logData);
};
