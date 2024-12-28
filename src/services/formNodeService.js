// src/services/formNodeService.js
import api from './api';

const BASE_URL = '/form-nodes';

/**
 * Fetch all form nodes.
 * @returns {Promise} API response with the form tree data.
 */
export const fetchFormNodes = () => {
    return api.get(BASE_URL);
};

/**
 * Add a new root-level node.
 * @param {Object} newNode - The details of the new root node.
 * @returns {Promise} API response.
 */
export const addTopLevelNode = (newNode) => {
    return api.post(`${BASE_URL}/top-level`, newNode);
};

/**
 * Add a new child node under a parent.
 * @param {Object} newNode - The details of the new node.
 * @param {string} parentId - The ID of the parent node.
 * @returns {Promise} API response.
 */
export const addChildNode = (newNode, parentId) => {
    return api.post(`${BASE_URL}/child`, newNode, {
        params: { parentId },
    });
};

/**
 * Delete a node by its ID.
 * @param {string} nodeId - The ID of the node to delete.
 * @returns {Promise} API response.
 */
export const deleteNode = (nodeId) => {
    return api.delete(`${BASE_URL}/${nodeId}`);
};
