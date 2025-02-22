import api from "./api";

const BASE_URL = "/test-subjects";

export const getAllTestSubjects = () => {
    return api.get(BASE_URL);
};

export const getTestSubjectById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

export const createTestSubject = (data) => {
    return api.post(`${BASE_URL}`, data);
};

export const updateTestSubject = (id, data) => {
    return api.put(`${BASE_URL}/${id}`, data);
};

export const deleteTestSubject = (id, userId) => {
    return api.delete(`${BASE_URL}/${id}/${userId}`);
};