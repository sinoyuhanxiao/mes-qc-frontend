import api from './api';

const BASE_URL = '/reporting';

/**
 * Extract widget data from the given JSON input.
 * @param {String} jsonInput - The JSON input containing widget data.
 * @returns {Promise} API response containing extracted widget data.
 */
export const extractWidgetData = (jsonInput) => {
    return api.post(`${BASE_URL}/extract`, jsonInput, {
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * Extract widget data along with count statistics.
 * @param {Long} formTemplateId - The Form Template ID.
 * @param {String} startDateTime
 * @param {String} endDateTime
 * @returns {Promise} API response containing widget data with counts.
 */
export const extractWidgetDataWithCounts = (formTemplateId, startDateTime, endDateTime) => {
    return api.post(`${BASE_URL}/extract-with-counts`, {}, { // Empty request body
        params: { formTemplateId, startDateTime, endDateTime},
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * Fetch QC records within a given date range, with optional pagination.
 * @param {Long} formTemplateId - The Form Template ID.
 * @param {String} startDateTime - The start date-time in "YYYY-MM-DD HH:mm:ss" format.
 * @param {String} endDateTime - The end date-time in "YYYY-MM-DD HH:mm:ss" format.
 * @param {Number} [page=0] - The page number for pagination (optional).
 * @param {Number} [size=10] - The number of records per page (optional).
 * @returns {Promise} API response containing the QC records.
 */
export const fetchQcRecords = (formTemplateId, startDateTime, endDateTime, page = 0, size = 1000) => {
    return api.get(`${BASE_URL}/qc-records`, {
        params: { formTemplateId, startDateTime, endDateTime, page, size },
        headers: { 'Content-Type': 'application/json' }
    });
};
