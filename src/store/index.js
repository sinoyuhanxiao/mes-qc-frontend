import { createStore } from 'vuex';

export default createStore({
    state: {
        user: {
            username: '默认用户',
            role: 1, // 1 表示管理员，2 表示质检人员
        },
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
        },
        clearUser(state) {
            state.user = { username: '', role: 1 };
        },
    },
    actions: {
        loginUser({ commit }, user) {
            commit('setUser', user);
        },
        logoutUser({ commit }) {
            commit('clearUser');
        },
    },
    getters: {
        getUser: (state) => state.user,
        getRoleName: (state) =>
            state.user.role === 1 ? '管理员' : state.user.role === 2 ? '质检人员' : '未知角色',
    },
});
