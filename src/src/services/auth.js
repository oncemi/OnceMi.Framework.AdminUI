import { UserManager, WebStorageStateStore } from "oidc-client";
import { POST_LOGOUT, POST_REFESH } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import store from "@/store";

const CLIENT_ID = process.env.VUE_APP_CLIENT_ID;

export const userManager = new UserManager({
  authority: process.env.VUE_APP_AUTHORITY,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  stateStore: new WebStorageStateStore({ store: window.localStorage }),
  client_id: CLIENT_ID,
  redirect_uri: `${window.location.origin}/#/callback`,
  silent_redirect_uri: `${window.location.origin}/#/refresh`,
  response_type: "code",
  scope: "openid profile api1 role organize offline_access",
  post_logout_redirect_uri: `${window.location.origin}`,
  filterProtocolClaims: true,
  accessTokenExpiringNotificationTime: 60,
  automaticSilentRenew: true,
  loadUserInfo: true,
  revokeAccessTokenOnSignout: true,
});

userManager.events.addUserSignedOut(() => {
  //account.logout();
  console.log("Events->addUserSignedOut");
});

userManager.events.addAccessTokenExpiring(function() {
  console.log("AccessToken will expiring, start refresh token...");
  refreshToken().catch(function(err) {
    console.log("[IdentityServer]RefreshToken failed, " + err.message);
    console.error(err);
  });
});

class ids4Account {
  refreshTokenPromise = null;

  async login() {
    await userManager.signinRedirect();
  }

  logout() {
    userManager
      .signoutRedirect()
      .then((result) => {
        localStorage.removeItem(process.env.VUE_APP_ROUTES_KEY);
        localStorage.removeItem(process.env.VUE_APP_PERMISSIONS_KEY);
        localStorage.removeItem(process.env.VUE_APP_ROLES_KEY);

        //set token null
        store.commit("account/setToken", null);
        //store.commit("account/setUser", null);
      })
      .catch((err) => {
        console.log("Sign out failed, " + err.message);
        console.error(err);
      });
  }

  // Renew the token manually
  refreshToken = () => {
    let newToken = null;
    if (this.refreshTokenPromise != null) {
      return this.refreshTokenPromise.then(() => {
        let lastRefeshToken = store.getters["account/token"];
        return lastRefeshToken;
      });
    }
    this.refreshTokenPromise = userManager
      .signinSilent()
      .then((user) => {
        this.refreshTokenPromise = null;
        newToken = user;
        store.commit("account/setToken", newToken);
        return newToken;
      })
      .catch((err) => {
        store.commit("account/setToken", newToken);
        this.refreshTokenPromise = null;
        console.error(err);
        return newToken;
      });
    return this.refreshTokenPromise;
  };

  // Get the user who is logged in
  getUser() {
    return userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          this.login();
          return null;
        } else {
          return user;
        }
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  }

  // Check if there is any user logged in
  getIsSigned() {
    return userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          return false;
        } else {
          return true;
        }
      })
      .catch((err) => {
        console.log(err);
        return null;
      });
  }

  // Get the profile of the user logged in
  getProfile() {
    return userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          this.login();
          return null;
        } else {
          return user.profile;
        }
      })
      .catch(function(err) {
        console.error(err);
        return null;
      });
  }

  // Get the token id
  getIdToken() {
    userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          this.login();
          return null;
        } else {
          return user.id_token;
        }
      })
      .catch((err) => {
        console.log(err);
        return null;
      });
  }

  // Get the session state
  getSessionState() {
    userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          this.login();
          return null;
        } else {
          return user.session_state;
        }
      })
      .catch((err) => {
        console.log(err);
        return null;
      });
  }

  // Get the access token of the logged in user
  getAcessToken() {
    return userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          this.login();
          return null;
        } else {
          return user.access_token;
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  // Get the user roles logged in
  getRole() {
    return userManager
      .getUser()
      .then((user) => {
        if (user == null) {
          this.login();
          return null;
        } else {
          return user.profile.role;
        }
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  }
}
class localAccount {
  refreshTokenPromise = null;

  refreshToken = () => {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise.then(() => {
        let lastRefeshToken = store.getters["account/token"];
        return lastRefeshToken;
      });
    }
    let newToken = null;
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
        }
        store.commit("account/setToken", newToken);
        this.refreshTokenPromise = null;
        return newToken;
      })
      .catch((err) => {
        store.commit("account/setToken", newToken);
        this.refreshTokenPromise = null;
        console.error(err);
        return newToken;
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
export const login = () => ids4At.login();
export const logout = () => ids4At.logout();
export const refreshToken = () => ids4At.refreshToken();
export const getUser = () => ids4At.getUser();
export const getRole = () => ids4At.getRole();
export const getProfile = () => ids4At.getProfile();

const localAt = new localAccount();
export const localRefreshToken = () => localAt.refreshToken();
export const localLogout = () => localAt.logout();
