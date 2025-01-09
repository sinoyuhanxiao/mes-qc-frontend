import api from './api';

const BASE_URL = '/dispatch';

export const getAllDispatches = () => {
    return api.get(BASE_URL);
}

export const getAllDispatchedTasks = () => {
    return api.get(`${BASE_URL}/dispatched-tasks`);
}

export const getScheduledTasks = (id) => {
    return api.get(`${BASE_URL}/scheduled-tasks`);
}

export const getDispatchNextExecutionTime = (id) => {
    return api.get(`${BASE_URL}/next-execution-time/${id}`);
}

export const getDispatchById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
}

export const createDispatch = (data) => {
    return api.post(BASE_URL, data);
}

export const createManualDispatch = (id) => {
    return api.post(`${BASE_URL}/manual`);
}

export const updateDispatch = (id, data) => {
    return api.put(`${BASE_URL}/${id}`, data);
}

export const deleteDispatch = (id) => {
    return api.delete(`${BASE_URL}/${id}`);
}



