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
 * @param inputCollectionName
 * @returns {Promise} API response containing the MongoDB document data.
 */
export const getMyDocument = (submissionId, qcFormTemplateId, createdBy, inputCollectionName) => {
    return api.get(`${BASE_URL}/document`, {
        params: { submissionId, qcFormTemplateId, createdBy, inputCollectionName },
    });
};

/**
 * Get all documents by qcFormTemplateId and createdBy.
 * @param {Long} qcFormTemplateId - The QC Form Template ID.
 * @param {Integer} createdBy - The user who created the documents.
 * @returns {Promise} API response containing the documents.
 */
export const getDocumentsForUser = (qcFormTemplateId, createdBy) => {
    return api.get(`${BASE_URL}/documents_for_user`, {
        params: { qcFormTemplateId, createdBy },
    });
};

/**
 * Export all documents by qcFormTemplateId and createdBy to Excel.
 * @param {Long} qcFormTemplateId - The QC Form Template ID.
 * @param {Integer} createdBy - The user who created the documents.
 * @returns {Promise} API response containing the Excel file as a blob.
 */
export const exportDocumentsToExcel = (qcFormTemplateId, createdBy) => {
    return api.get(`${BASE_URL}/excel_documents_for_user`, {
        params: { qcFormTemplateId, createdBy },
        responseType: 'blob', // Ensures the response is treated as a file
    });
};

/**
 * Export a MongoDB document to PDF.
 * @param {String} submissionId - The MongoDB document's ObjectId.
 * @param {Long} qcFormTemplateId - The QC Form Template ID.
 * @param {Integer} createdBy - The user who created the form.
 * @param inputCollectionName
 * @returns {Promise} API response containing the PDF file as a blob.
 */
export const exportDocumentToPDF = (submissionId, qcFormTemplateId, createdBy, inputCollectionName) => {
    return api.get(`${BASE_URL}/document_pdf`, {
        params: { submissionId, qcFormTemplateId, createdBy, inputCollectionName },
        responseType: 'blob', // Ensures the response is treated as a file
    });
};


