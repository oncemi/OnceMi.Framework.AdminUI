import Cookie from "js-cookie";

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
        message.error("请求失败，权限不足");
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
  onFulfilled(config, options) {
    const { message } = options;
    const { url, xsrfCookieName } = config;
    if (
      typeof url != "undefined" &&
      url.toLowerCase().indexOf("login") === -1 &&
      url.toLowerCase().indexOf("callback") === -1 &&
      url.toLowerCase().indexOf("refesh") === -1 &&
      xsrfCookieName &&
      !Cookie.get(xsrfCookieName)
    ) {
      message.warning("认证已过期，请重新登录");
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
