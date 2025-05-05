import api from "./api"; // Use production API instance

const BASE_URL = "/alert-records";

/**
 * Fetch a paginated list of alert records.
 * @param {number} page - The page number (0-based).
 * @param {number} size - Number of records per page.
 * @returns {Promise} API response containing Page<DetailedAlertRecordDTO>
 */
export const getPaginatedAlertRecords = (page = 0, size = 10) => {
    return api.get(`${BASE_URL}`, {
        params: {
            page,
            size
        }
    });
};

/**
 * Fetch summary statistics for alert records (status, risk level, product, inspection item).
 * @returns {Promise} API response containing AlertSummaryDTO
 */
export const getAlertSummary = () => {
    return api.get(`${BASE_URL}/summary`);
};

