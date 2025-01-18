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

/**
 * Get all QC Task Submission Logs by createdBy and dispatchedTaskId.
 * @param {Integer} createdBy - The user who created the log.
 * @param {Long} dispatchedTaskId - The ID of the dispatched task.
 * @returns {Promise} API response containing the task logs.
 */
export const getAllTaskLogs = (createdBy, dispatchedTaskId) => {
    return api.get(`${BASE_URL}`, {
        params: { createdBy, dispatchedTaskId },
    });
};

/**
 * Get MongoDB document data by submission ID.
 * @param {String} submissionId - The MongoDB document's ObjectId.
 * @param {String} qcFormTemplateId - The form template ID.
 * @param {Integer} createdBy - The user who created the form.
 * @returns {Promise} API response containing the MongoDB document data.
 */
export const getMyDocument = (submissionId, qcFormTemplateId, createdBy) => {
    return api.get(`${BASE_URL}/document`, {
        params: { submissionId, qcFormTemplateId, createdBy },
    });
};
