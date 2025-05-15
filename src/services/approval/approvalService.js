import api from "../api"; // Use production API instance

const BASE_URL = "/approval";

export const getPaginatedApprovalAssignments = (params = {}) => {
    return api.get(`${BASE_URL}/assignments-filter`, { params });
};
