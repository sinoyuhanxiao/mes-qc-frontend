// src/services/qcFormDataService.js
import api from './api';

const BASE_URL = '/qc-form-data';

/**
 * Insert form data into the backend for a specific user and collection.
 * @param {string} userId - The ID of the user submitting the form.
 * @param {string} collectionName - The dynamic collection name.
 * @param {Object} formData - The form data to be inserted.
 * @returns {Promise} API response after inserting form data.
 */
export const insertFormData = (userId, collectionName, formData) => {
    return api.post(`${BASE_URL}/insert-form/${userId}/${collectionName}`, formData);
};
