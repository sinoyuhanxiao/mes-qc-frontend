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

/**
 * Submit an edited version of form data with parent-child linkage.
 * @param {string} userId - The ID of the user making the edit.
 * @param {string} collectionName - The collection name where the original form resides.
 * @param {string} parentSubmissionId - The ID of the original submission being edited.
 * @param {string|number} templateId - The form template ID.
 * @param {Object} updatedFormData - The modified form content to be inserted.
 * @returns {Promise} API response after inserting the edited version.
 */
export const editFormData = (userId, collectionName, parentSubmissionId, templateId, updatedFormData) => {
    return api.post(
        `${BASE_URL}/edit-form/${userId}/${collectionName}`,
        updatedFormData,
        {
            params: {
                parentId: parentSubmissionId,
                templateId: templateId
            }
        }
    );
};
