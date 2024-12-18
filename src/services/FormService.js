import axios from 'axios'

const BASE_URL = 'http://localhost:8080/api/forms'

export function getForms() {
    return axios.get(BASE_URL)
}

export function saveForm(form) {
    return axios.post(BASE_URL, form)
}

export function deleteForm(id) {
    return axios.delete(`${BASE_URL}/${id}`)
}
