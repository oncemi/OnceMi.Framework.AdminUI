import { UserManager, WebStorageStateStore } from "oidc-client";
import { setAuthorization, removeAuthorization } from "@/utils/request";

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
    console.log("RefreshToken failed, " + JSON.stringify(err));
    console.error(err);
  });
});

class Account {
  async login() {
    await userManager.signinRedirect();
  }

  async logout() {
    localStorage.removeItem(process.env.VUE_APP_ROUTES_KEY);
    localStorage.removeItem(process.env.VUE_APP_PERMISSIONS_KEY);
    localStorage.removeItem(process.env.VUE_APP_ROLES_KEY);
    removeAuthorization();
    await userManager.signoutRedirect();
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
            setAuthorization(user);
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

const account = new Account();

export const login = async () => account.login();
export const logout = async () => account.logout();
export const refreshToken = () => account.refreshToken();
export const getUser = () => account.getUser();
export const getRole = () => account.getRole();
export const getProfile = () => account.getProfile();

export default account;
