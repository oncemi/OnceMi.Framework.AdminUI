export default {
  namespaced: true,
  state: {
    name: "",
    user: undefined,
    token: undefined,
    permissions: undefined,
    roles: undefined,
    routesConfig: undefined,
  },
  getters: {
    user: (state) => {
      if (!state.user) {
        try {
          const user = localStorage.getItem(process.env.VUE_APP_USER_KEY);
          state.user = JSON.parse(user);
        } catch (e) {
          console.error(e);
        }
      }
      return state.user;
    },
    token: (state) => {
      if (!state.token) {
        try {
          const token = localStorage.getItem(process.env.VUE_APP_TOKEN_KEY);
          state.token = JSON.parse(token);
        } catch (e) {
          console.error(e);
        }
      }
      return state.token;
    },
    permissions: (state) => {
      if (!state.permissions) {
        try {
          const permissions = localStorage.getItem(process.env.VUE_APP_PERMISSIONS_KEY);
          state.permissions = JSON.parse(permissions);
          state.permissions = state.permissions ? state.permissions : [];
        } catch (e) {
          console.error(e.message);
        }
      }
      return state.permissions;
    },
    roles: (state) => {
      if (!state.roles) {
        try {
          const roles = localStorage.getItem(process.env.VUE_APP_ROLES_KEY);
          state.roles = JSON.parse(roles);
          state.roles = state.roles ? state.roles : [];
        } catch (e) {
          console.error(e.message);
        }
      }
      return state.roles;
    },
    routesConfig: (state) => {
      if (!state.routesConfig) {
        try {
          const routesConfig = localStorage.getItem(process.env.VUE_APP_ROUTES_KEY);
          state.routesConfig = JSON.parse(routesConfig);
          state.routesConfig = state.routesConfig ? state.routesConfig : [];
        } catch (e) {
          console.error(e.message);
        }
      }
      return state.routesConfig;
    },
  },
  mutations: {
    setName: (state, name) => {
      state.name = name;
    },
    setUser(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem(process.env.VUE_APP_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(process.env.VUE_APP_USER_KEY);
      }
    },
    setToken(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem(process.env.VUE_APP_TOKEN_KEY, JSON.stringify(token));
      } else {
        localStorage.removeItem(process.env.VUE_APP_TOKEN_KEY);
      }
    },
    setPermissions(state, permissions) {
      state.permissions = permissions;
      localStorage.setItem(process.env.VUE_APP_PERMISSIONS_KEY, JSON.stringify(permissions));
    },
    setRoles(state, roles) {
      state.roles = roles;
      localStorage.setItem(process.env.VUE_APP_ROLES_KEY, JSON.stringify(roles));
    },
    setRoutesConfig(state, routesConfig) {
      state.routesConfig = routesConfig;
      localStorage.setItem(process.env.VUE_APP_ROUTES_KEY, JSON.stringify(routesConfig));
    },
  },
};
