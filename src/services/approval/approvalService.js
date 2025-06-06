import api from "../api"; // Use production API instance

const BASE_URL = "/approval";

/**
 * Fetch paginated approval assignments with optional filters.
 * @param {Object} params - Filtering options (state, approvalType, etc.).
 * @returns {Promise} API response with paginated results.
 */
export const getPaginatedApprovalAssignments = (params = {}) => {
    return api.get(`${BASE_URL}/assignments-filter`, { params });
};

/**
 * Get version history for a submission by ID and collection name.
 * @param {string} submissionId - The submission's MongoDB ObjectId.
 * @param {string} collectionName - The MongoDB collection name.
 * @returns {Promise} API response with the version history documents.
 */
export const getVersionHistory = (submissionId, collectionName) => {
    return api.get(`${BASE_URL}/version-history`, {
        params: { submissionId, collectionName }
    });
};

/**
 * Get the approval_info array for a specific submission.
 * @param {string} submissionId - The submission's MongoDB ObjectId.
 * @param {string} collectionName - The MongoDB collection name.
 * @returns {Promise} API response with approval_info array.
 */
export const getApprovalInfo = (submissionId, collectionName) => {
    return api.get(`${BASE_URL}/approval-info`, {
        params: { submissionId, collectionName }
    });
};

/**
 * Submit an approval action (signature, comment, retest decision).
 * @param {Object} payload - Includes submissionId, collectionName, role, approverId, comment, suggestRetest, eSignature.
 * @returns {Promise} API response after applying the approval update.
 */
export const submitApprovalAction = (payload) => {
    return api.post(`${BASE_URL}/approve`, payload);
};
