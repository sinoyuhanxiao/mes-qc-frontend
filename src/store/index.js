import { createStore } from 'vuex';

// Functions to generate dynamic keys based on the username
function generateUserKey(username) {
    return `user_data_${username}`;
}

function generateExpirationKey(username) {
    return `user_expiration_${username}`;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours = 86400000 milliseconds

// Load user data dynamically from localStorage
function loadUser() {
    const storedUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const userKey = storedUser.username ? generateUserKey(storedUser.username) : null;
    const expirationKey = storedUser.username ? generateExpirationKey(storedUser.username) : null;

    if (userKey && expirationKey) {
        const userData = localStorage.getItem(userKey);
        const expiration = localStorage.getItem(expirationKey);

        if (userData && expiration) {
            const now = new Date().getTime();
            if (now < parseInt(expiration)) {
                return JSON.parse(userData);
            } else {
                // Session expired, clear stored data
                localStorage.removeItem(userKey);
                localStorage.removeItem(expirationKey);
                localStorage.removeItem('current_user');
            }
        }
    }

    return { id: 0, username: '默认用户', role: 0, name: '默认名称'};
}

export default createStore({
    state: {
        user: loadUser(),
    },
    mutations: {
        setUser(state, user) {
            state.user = user;

            // Store current user for reference
            localStorage.setItem('current_user', JSON.stringify({ username: user.username, name: user.name}));

            // Generate dynamic keys based on the username
            const userKey = generateUserKey(user.username);
            const expirationKey = generateExpirationKey(user.username);

            // Save user data and expiration time to localStorage
            localStorage.setItem(userKey, JSON.stringify(user));
            localStorage.setItem(expirationKey, (new Date().getTime() + SESSION_DURATION).toString());
        },
        updateUserInfo(state, updatedUser) {
            state.user = { ...state.user, ...updatedUser };
            localStorage.setItem('current_user', JSON.stringify({ username: state.user.username, name: state.user.name }));
            const userKey = generateUserKey(state.user.username);
            localStorage.setItem(userKey, JSON.stringify(state.user));
        },
        clearUser(state) {
            const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
            const userKey = currentUser.username ? generateUserKey(currentUser.username) : null;
            const expirationKey = currentUser.username ? generateExpirationKey(currentUser.username) : null;

            state.user = { id: 0, username: '', name: '', role: 0 };

            // Clear dynamic keys and current user reference
            if (userKey) localStorage.removeItem(userKey);
            if (expirationKey) localStorage.removeItem(expirationKey);
            localStorage.removeItem('current_user');
        },
    },
    actions: {
        loginUser({ commit }, user) {
            commit('setUser', user);
        },
        updateUserState({ commit }, updatedUser) {
            commit('updateUserInfo', updatedUser);
        },
        logoutUser({ commit }) {
            commit('clearUser');
        },
    },
    getters: {
        getUser: (state) => state.user,
        getName: (state) => state.user.name, // Added getter for `name`
        getRoleName: (state) =>
            state.user.role.name
    },
});
