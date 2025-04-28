import api from './api';

const RECIPE_URL = '/recipes';

/**
 * Get control limits by QC form template ID.
 * @param {number} templateId - The QC form template ID.
 * @returns {Promise} API response with ControlLimitSettingDTO.
 */
export const fetchControlLimitsByTemplateId = (templateId) => {
    return api.get(`${RECIPE_URL}/${templateId}`);
};

/**
 * Update control limits for a QC form template.
 * ⚠️ You must provide the full control_limits object (both changed and unchanged fields).
 * Omitting any key will result in its deletion from the database.
 *
 * @param {object} data - ControlLimitSettingDTO object
 * @param {number} data.qc_form_template_id - The QC form template ID.
 * @param {object} data.control_limits - Map of all control limit entries keyed by name.
 * @returns {Promise} API response after update.
 */
export const updateControlLimits = (data) => {
    return api.put(`${RECIPE_URL}/update`, data);
};
