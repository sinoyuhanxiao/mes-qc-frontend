import api from "../api"; // Use production API instance

const BASE_URL = "/approval";

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
