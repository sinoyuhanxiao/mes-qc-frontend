import api from './api';

const BASE_URL = '/qc-order';

/**
 * Create a new QC Order with its Dispatches.
 */
export const createQcOrder = (data, userId) => {
    return api.post(`${BASE_URL}/${userId}`, data);
}

/**
 * Update an existing QC Order.
 */
export const updateQcOrder = (orderId, data, userId) => {
    return api.put(`${BASE_URL}/${orderId}/${userId}`, data);
};

/**
 * Pause a Dispatch within a QC Order.
 */
export const pauseDispatch = (orderId, dispatchId, userId) => {
    return api.put(`${BASE_URL}/${orderId}/dispatch/${dispatchId}/pause/${userId}`);
};

/**
 * Resume a paused Dispatch within a QC Order.
 */
export const resumeDispatch = (orderId, dispatchId, userId) => {
    return api.put(`${BASE_URL}/${orderId}/dispatch/${dispatchId}/resume/${userId}`);
};

/**
 * Retrieve a QC Order by ID.
 */
export const getQcOrderById = (orderId) => {
    return api.get(`${BASE_URL}/${orderId}`);
};

/**
 * Retrieve a list of all QC Orders.
 */
export const getAllQcOrders = () => {
    return api.get(BASE_URL);
};

/**
 * Delete a QC Order by ID.
 */
export const deleteQcOrder = (orderId) => {
    return api.delete(`${BASE_URL}/${orderId}`);
};