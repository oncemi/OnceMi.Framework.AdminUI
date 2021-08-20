import { UserManager, WebStorageStateStore } from "oidc-client";
import { POST_LOGOUT, POST_REFESH } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import store from "@/store";

const CLIENT_ID = process.env.VUE_APP_CLIENT_ID;

export const userManager = new UserManager({
  authority: process.env.VUE_APP_AUTHORITY,
  loadUserInfo: true,
  //revokeAccessTokenOnSignout: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  stateStore: new WebStorageStateStore({ store: window.localStorage }),
  client_id: CLIENT_ID,
  redirect_uri: `${window.location.origin}/#/callback`,
  automaticSilentRenew: true,
  silent_redirect_uri: `${window.location.origin}/#/refresh`,
  response_type: "code",
  scope: "openid profile api1 role organize offline_access",
  post_logout_redirect_uri: `${window.location.origin}`,
  filterProtocolClaims: true,
});

userManager.events.addUserSignedOut(async () => {
  //account.logout();
  console.log("Events->addUserSignedOut");
});

userManager.events.addAccessTokenExpiring(function() {
  console.log("AccessToken expiring, start refresh token...");
  refreshToken().catch(function(err) {
    console.log("[IdentityServer]RefreshToken failed, " + JSON.stringify(err));
    console.error(err);
  });
});

class ids4Account {
  async login() {
    await userManager.signinRedirect();
  }

  async logout() {
    localStorage.removeItem(process.env.VUE_APP_ROUTES_KEY);
    localStorage.removeItem(process.env.VUE_APP_PERMISSIONS_KEY);
    localStorage.removeItem(process.env.VUE_APP_ROLES_KEY);

    await userManager.signoutRedirect();
    //set token null
    store.commit("account/setToken", null);
    //store.commit("account/setUser", null);
  }

  // Renew the token manually
  refreshToken() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .signinSilent()
        .then(function(user) {
          if (user == null) {
            self.login();
          } else {
            store.commit("account/setToken", user);
            return resolve(user);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Get the user who is logged in
  getUser() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            self.login();
            return resolve(null);
          } else {
            return resolve(user);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Check if there is any user logged in
  getIsSigned() {
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            return resolve(false);
          } else {
            return resolve(true);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Get the profile of the user logged in
  getProfile() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            self.login();
            return resolve(null);
          } else {
            return resolve(user.profile);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Get the token id
  getIdToken() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            self.login();
            return resolve(null);
          } else {
            return resolve(user.id_token);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Get the session state
  getSessionState() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            self.login();
            return resolve(null);
          } else {
            return resolve(user.session_state);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Get the access token of the logged in user
  getAcessToken() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            self.login();
            return resolve(null);
          } else {
            return resolve(user.access_token);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }

  // Get the user roles logged in
  getRole() {
    let self = this;
    return new Promise((resolve, reject) => {
      userManager
        .getUser()
        .then(function(user) {
          if (user == null) {
            self.login();
            return resolve(null);
          } else {
            return resolve(user.profile.role);
          }
        })
        .catch(function(err) {
          console.log(err);
          return reject(err);
        });
    });
  }
}
class localAccount {
  refreshTokenPromise = null;

  refreshToken = async () => {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise.then(() => {
        let lastRefeshToken = store.getters["account/token"];
        return lastRefeshToken;
      });
    }
    let newToken = undefined;
    let oldToken = store.getters["account/token"];
    if (!oldToken || !oldToken.refresh_token) {
      return newToken;
    }
    this.refreshTokenPromise = request(POST_REFESH, METHOD.POST, {
      Token: oldToken.refresh_token,
    })
      .then((result) => {
        if (result && result.data.code == 0) {
          let userToken = {
            access_token: result.data.data.accessToken,
            refresh_token: result.data.data.refreshToken,
            token_type: result.data.data.tokenType,
            expires_at: result.data.data.expiresAt,
            profile: result.data.data.profile,
            isRemember: oldToken.isRemember,
          };
          newToken = userToken;
          //设置用户
          if (newToken) {
            store.commit("account/setToken", newToken);
          }
          this.refreshTokenPromise = null;
          return newToken;
        }
      })
      .catch((err) => {
        console.error(err);
      });
    return this.refreshTokenPromise;
  };

  logout = async () => {
    localStorage.removeItem(process.env.VUE_APP_ROUTES_KEY);
    localStorage.removeItem(process.env.VUE_APP_PERMISSIONS_KEY);
    localStorage.removeItem(process.env.VUE_APP_ROLES_KEY);

    let token = store.getters["account/token"];
    //clean
    store.commit("account/setToken", null);
    //store.commit("account/setUser", null);

    if (token && token.refresh_token) {
      await request(POST_LOGOUT, METHOD.POST, {
        Token: token.refresh_token,
      });
    }
  };
}

const ids4At = new ids4Account();

export const login = async () => ids4At.login();
export const logout = async () => ids4At.logout();
export const refreshToken = () => ids4At.refreshToken();
export const getUser = () => ids4At.getUser();
export const getRole = () => ids4At.getRole();
export const getProfile = () => ids4At.getProfile();

const localAt = new localAccount();

export const localRefreshToken = async () => localAt.refreshToken();
export const localLogout = async () => localAt.logout();
