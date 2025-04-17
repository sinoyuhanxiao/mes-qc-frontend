// shiftService.js
import api from "./api";

const BASE_URL = "/shift";

export const getAllShifts = () => {
    return api.get(BASE_URL);
};

export const getShiftById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

export const createShift = (data) => {
    return api.post(`${BASE_URL}`, data);
};

export const updateShift = (id, data) => {
    return api.put(`${BASE_URL}/${id}`, data);
};

export const deleteShift = (id, userId) => {
    return api.delete(`${BASE_URL}/${id}/${userId}`);
};
