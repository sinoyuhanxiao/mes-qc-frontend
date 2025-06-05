// src/utils/formDraftStorage.js

export function saveFormDraftForUser(userId, formId, data) {
    const key = `draft_${userId}_${formId}`;
    localStorage.setItem(key, JSON.stringify(data));
}

export function loadFormDraftForUser(userId, formId) {
    const key = `draft_${userId}_${formId}`;
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : null;
}

export function clearDraftForUser(userId, formId) {
    const key = `draft_${userId}_${formId}`;
    localStorage.removeItem(key);
}
