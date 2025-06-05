// utils/formDraftStorage.js
export function saveUserDraft(userId, formId, data) {
    const key = `draft_${userId}_${formId}`;
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify({ data, expiry }));
}

export function loadUserDraft(userId, formId) {
    const key = `draft_${userId}_${formId}`;
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const { data, expiry } = JSON.parse(itemStr);
    if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return data;
}
