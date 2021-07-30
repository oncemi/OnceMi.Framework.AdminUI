import { ROUTES, GETAVATAR, GET_USER_ROLE_PERMISSION } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import { getProfile } from "@/services/auth";

export async function getUserRoutes() {
  return request(ROUTES, METHOD.GET);
}

export async function getUserInfo() {
  let userInfoFromJwt = null;
  await getProfile().then(function(data) {
    userInfoFromJwt = data;
  });
  if (userInfoFromJwt == null) {
    return null;
  }
  let resultUserInfo = {
    id: userInfoFromJwt?.sub,
    name: userInfoFromJwt?.name,
    nickName: userInfoFromJwt?.nickname,
    avatar: userInfoFromJwt?.picture,
    address: userInfoFromJwt?.address,
    position: {
      CN: "未知",
      HK: "未知",
      US: "Unknow",
    },
  };
  //设置头像
  if (resultUserInfo.avatar == null || resultUserInfo.avatar == "") {
    resultUserInfo.avatar = GETAVATAR + "/" + resultUserInfo.name;
  }
  return resultUserInfo;
}

export async function getUserRoles() {
  return request(GET_USER_ROLE_PERMISSION, METHOD.GET);
}

export default {
  getUserInfo,
  getUserRoles,
  getUserRoutes,
};
