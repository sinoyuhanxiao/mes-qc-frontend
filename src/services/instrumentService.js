import api from "./api";

const BASE_URL = "/instrument";

export const getAllInstruments = () => {
    return api.get(BASE_URL);
};

export const getInstrumentById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

export const createInstrument = (data, userId) => {
    return api.post(`${BASE_URL}/${userId}`, data);
};

export const updateInstrument = (id, data, userId) => {
    return api.put(`${BASE_URL}/${id}/${userId}`, data);
};

export const deleteInstrument = (id, userId) => {
    return api.delete(`${BASE_URL}/${id}/${userId}`);
};
