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
 * @returns {Promise} API response containing widget data with counts.
 */
export const extractWidgetDataWithCounts = (formTemplateId) => {
    return api.post(`${BASE_URL}/extract-with-counts`, {}, { // Empty request body
        params: { formTemplateId },
        headers: { 'Content-Type': 'application/json' }
    });
};
