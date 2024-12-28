// src/services/qcFormTemplateService.js
import api from './api';

const BASE_URL = '/qc-form-templates';

/**
 * Fetch a form template by its ID.
 * @param {string} formTemplateId - The ID of the form template.
 * @returns {Promise} API response with the form template data.
 */
export const fetchFormTemplate = (formTemplateId) => {
    return api.get(`${BASE_URL}/${formTemplateId}`);
};

/**
 * Save a new form template with associated nodes.
 * @param {Object} payload - The form template and associated node details.
 * @returns {Promise} API response after saving the template.
 */
export const createFormTemplateWithNodes = (payload) => {
    return api.post(`${BASE_URL}/create-with-nodes`, payload);
};
