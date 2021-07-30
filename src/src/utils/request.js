import axios from "axios";
import Cookie from "js-cookie";

// 跨域认证信息 header 名
const xsrfHeaderName = "Authorization";

axios.defaults.timeout = 5000;
axios.defaults.withCredentials = true;
axios.defaults.xsrfHeaderName = xsrfHeaderName;
axios.defaults.xsrfCookieName = xsrfHeaderName;

// 认证类型
const AUTH_TYPE = {
  BEARER: "Bearer",
  BASIC: "basic",
};

// http method
const METHOD = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
};

/**
 * axios请求
 * @param url 请求地址
 * @param method {METHOD} http method
 * @param params 请求参数
 * @returns {Promise<AxiosResponse<T>>}
 */
async function request(url, method, params, config) {
  switch (method) {
    case METHOD.GET:
      return axios.get(url, { params, ...config });
    case METHOD.POST:
      return axios.post(url, params, config);
    case METHOD.PUT:
      return axios.put(url, params, config);
    case METHOD.DELETE: {
      if (config) {
        config.data = params;
      } else {
        config = {
          data: params,
        };
      }
      return axios.delete(url, config);
    }
    default:
      return axios.get(url, { params, ...config });
  }
}

/**
 * 设置认证信息
 * @param auth {Object}
 * @param authType {AUTH_TYPE} 认证类型，默认：{AUTH_TYPE.BEARER}
 */
function setAuthorization(user, authType = AUTH_TYPE.BEARER) {
  switch (authType) {
    case AUTH_TYPE.BEARER:
      Cookie.set(xsrfHeaderName, "Bearer " + user.access_token, {
        expires: new Date(parseInt(user.expires_at) * 1000),
        sameSite: "none",
        secure: true,
      });
      break;
    case AUTH_TYPE.BASIC:
    default:
      break;
  }
  localStorage.setItem(process.env.VUE_APP_TOKEN_KEY, user);
}

/**
 * 移出认证信息
 * @param authType {AUTH_TYPE} 认证类型
 */
function removeAuthorization(authType = AUTH_TYPE.BEARER) {
  switch (authType) {
    case AUTH_TYPE.BEARER:
      Cookie.remove(xsrfHeaderName);
      break;
    case AUTH_TYPE.BASIC:
    default:
      break;
  }
  localStorage.removeItem(process.env.VUE_APP_TOKEN_KEY);
}

/**
 * 检查认证信息
 * @param authType
 * @returns {boolean}
 */
function checkAuthorization(authType = AUTH_TYPE.BEARER) {
  switch (authType) {
    case AUTH_TYPE.BEARER:
      if (Cookie.get(xsrfHeaderName)) {
        return true;
      }
      break;
    case AUTH_TYPE.BASIC:
    default:
      break;
  }
  return false;
}

/**
 * 加载 axios 拦截器
 * @param interceptors
 * @param options
 */
function loadInterceptors(interceptors, options) {
  const { request, response } = interceptors;
  // 加载请求拦截器
  request.forEach((item) => {
    let { onFulfilled, onRejected } = item;
    if (!onFulfilled || typeof onFulfilled !== "function") {
      onFulfilled = (config) => config;
    }
    if (!onRejected || typeof onRejected !== "function") {
      onRejected = (error) => Promise.reject(error);
    }
    axios.interceptors.request.use(
      (config) => onFulfilled(config, options),
      (error) => onRejected(error, options)
    );
  });
  // 加载响应拦截器
  response.forEach((item) => {
    let { onFulfilled, onRejected } = item;
    if (!onFulfilled || typeof onFulfilled !== "function") {
      onFulfilled = (response) => response;
    }
    if (!onRejected || typeof onRejected !== "function") {
      onRejected = (error) => Promise.reject(error);
    }
    axios.interceptors.response.use(
      (response) => onFulfilled(response, options),
      (error) => onRejected(error, options)
    );
  });
}

/**
 * 解析 url 中的参数
 * @param url
 * @returns {Object}
 */
function parseUrlParams(url) {
  const params = {};
  if (!url || url === "" || typeof url !== "string") {
    return params;
  }
  const paramsStr = url.split("?")[1];
  if (!paramsStr) {
    return params;
  }
  const paramsArr = paramsStr.replace(/&|=/g, " ").split(" ");
  for (let i = 0; i < paramsArr.length / 2; i++) {
    const value = paramsArr[i * 2 + 1];
    params[paramsArr[i * 2]] = value === "true" ? true : value === "false" ? false : value;
  }
  return params;
}

export {
  METHOD,
  AUTH_TYPE,
  request,
  setAuthorization,
  removeAuthorization,
  checkAuthorization,
  loadInterceptors,
  parseUrlParams,
};
