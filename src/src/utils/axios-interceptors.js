import { refreshToken, localRefreshToken } from "../services/auth";

const resperr = {
  /**
   * 响应数据成功
   * @param response 响应对象
   * @param options 应用配置 包含: {router, i18n, store, message}
   * @returns {*}
   */
  onFulfilled(response, options) {
    const { message } = options;
    if (!response.data) {
      message.error(`请求数据异常（Status:200），服务器返回内容为空`);
      return null;
    }
    const code = response.data.code;
    if (code != 0) {
      message.warning(`${response.data.message}(错误码：${response.data.code})`);
    }
    return response;
  },
  /**
   * 响应出错时执行
   * @param error 错误对象
   * @param options 应用配置 包含: {router, i18n, store, message}
   * @returns {Promise<never>}
   */
  onRejected(error, options) {
    const { message } = options;
    const { response } = error;
    if (!response || !response.data) {
      message.error(
        !response
          ? `请求数据失败，服务器返回内容为空或网络异常`
          : `请求数据失败（Status:${response.status}），服务器返回内容为空或网络异常`
      );
      return Promise.reject(error);
    }
    switch (response.status) {
      case 400:
        {
          let errMsg = response.data?.message
            ? `请求失败，${response.data?.message}`
            : "请求失败，请检查数据是否完整或网络是否连接.";
          message.error(errMsg);
        }
        break;
      case 401:
        message.error("请求失败，请先登录");
        break;
      case 403:
        message.error("请求失败，没有执行此操作的权限");
        break;
      case 404:
        message.error("请求失败（404 Not Found），请检查接口配置是否正确或联系管理员");
        break;
      case 415:
        message.error("请求失败，未知的请求类型");
        break;
      case 500:
        {
          let errMsg = response.data?.message ? `请求失败，${response.data?.message}` : "请求失败，服务器内部错误";
          message.error(errMsg);
        }
        break;
      default:
        {
          if (response.data != null && response.data?.message != null) {
            message.error(`请求失败(Status:${response.status}，Code:${response.data.code})，${response.data?.message}`);
          } else {
            message.error(`请求失败(Status:${response.status})，未知错误`);
          }
        }
        break;
    }
    return Promise.reject(error);
  },
};

const reqCommon = {
  /**
   * 发送请求之前做些什么
   * @param config axios config
   * @param options 应用配置 包含: {router, i18n, store, message}
   * @returns {*}
   */
  async onFulfilled(config, options) {
    let requestUrlInIgnoreList = function(url) {
      if (!url) {
        return false;
      }
      const ignoreApiArgs = ["login", "callback", "refesh", "revoketoken"];
      url = url.toLowerCase();
      for (let i = 0; i < ignoreApiArgs.length; i++) {
        if (url.indexOf(ignoreApiArgs[i]) >= 0) {
          return true;
        }
      }
      return false;
    };
    let requestFailed = function() {
      message.warning("认证已过期，请重新登录");
      window.location.replace("/");
      return Promise.reject();
    };

    const { message, store } = options;
    const { url } = config;
    const token = store.getters["account/token"];
    const isExpires = (token ? token.expires_at : 0) - 60 < Math.round(new Date().getTime() / 1000);

    if (!requestUrlInIgnoreList(url) && (!token || isExpires)) {
      if (token && isExpires) {
        if (store.state.setting.isEnabledIdentityServer) {
          //IdentityServer token refesh
          console.log("[IdentityServer]AccessToken expiring, start refresh token...");
          let newToken = await refreshToken();
          if (newToken) {
            console.log("[IdentityServer]Refresh successful, token is " + JSON.stringify(newToken));
            config.headers.Authorization = `Bearer ${newToken.access_token}`;
          } else {
            return requestFailed();
          }
        } else {
          //本地刷新
          console.log("[Local]AccessToken expiring, start refresh token...");
          let newToken = await localRefreshToken();
          if (newToken) {
            console.log("[Local]Refresh successful, token is " + JSON.stringify(newToken));
            config.headers.Authorization = `Bearer ${newToken.access_token}`;
          } else {
            return requestFailed();
          }
        }
      } else {
        return requestFailed();
      }
    } else {
      if (!requestUrlInIgnoreList(url)) {
        config.headers.Authorization = `Bearer ${token.access_token}`;
      }
    }
    return config;
  },

  /**
   * 请求出错时做点什么
   * @param error 错误对象
   * @param options 应用配置 包含: {router, i18n, store, message}
   * @returns {Promise<never>}
   */
  onRejected(error, options) {
    const { message } = options;
    message.error(error.message);
    return Promise.reject(error);
  },
};

export default {
  request: [reqCommon], // 请求拦截
  response: [resperr], // 响应拦截
};
