import api from './api';

const BASE_URL = '/dispatch';

export const getAllDispatches = () => {
    return api.get(BASE_URL);
}

export const getAllDispatchedTasks = () => {
    return api.get(`${BASE_URL}/dispatched-tasks`);
}

export const getDispatchById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
}

export const createDispatch = (data) => {
    return api.post(BASE_URL, data);
}

export const updateDispatch = (id, data) => {
    return api.put(`${BASE_URL}/${id}`, data);
}

export const deleteDispatch = (id) => {
    return api.delete(`${BASE_URL}/${id}`);
}

export const manualTriggerDispatch = (id) => {
    return api.post(`${BASE_URL}/manual_trigger/${id}`);
}

