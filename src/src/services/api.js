//跨域代理前缀
// const API_PROXY_PREFIX='/api'
// const BASE_URL = process.env.NODE_ENV === 'production' ? process.env.VUE_APP_API_BASE_URL : API_PROXY_PREFIX
const BASE_URL = process.env.VUE_APP_API_BASE_URL;
module.exports = {
  ROUTES: `${BASE_URL}/api/v1/Menu/QueryViewMenu`,
  GETAVATAR: `${BASE_URL}/api/v1/User/GetAvatar`,
  GET_USER_ROLE_PERMISSION: `${BASE_URL}/api/v1/Permission/QueryUserRolePermission`, //角色权限列表
  //Permission
  GET_PERMISSION_LIST: `${BASE_URL}/api/v1/Permission`, //授权列表
  GET_ROLE_PERMISSION: `${BASE_URL}/api/v1/Permission/`,
  PUT_ROLE_PERMISSION: `${BASE_URL}/api/v1/Permission`,
  //View
  GET_VIEW_LIST: `${BASE_URL}/api/v1/View`,
  DELETE_VIEW_ITEM: `${BASE_URL}/api/v1/View`,
  POST_VIEW_ITEM: `${BASE_URL}/api/v1/View`,
  PUT_VIEW_ITEM: `${BASE_URL}/api/v1/View`,
  GET_VIEW_CASCADER: `${BASE_URL}/api/v1/View/CascaderList`,
  //Menu
  GET_MENU_LIST: `${BASE_URL}/api/v1/Menu/QueryByPage`,
  DELETE_MENU_ITEM: `${BASE_URL}/api/v1/Menu`,
  POST_MENU_ITEM: `${BASE_URL}/api/v1/Menu`,
  PUT_MENU_ITEM: `${BASE_URL}/api/v1/Menu`,
  GET_MENU_TYPES: `${BASE_URL}/api/v1/Menu/GetMenuTypes`,
  GET_MENU_NEXT_SORT_VALUE: `${BASE_URL}/api/v1/Menu/GetNextSortValue`,
  GET_MENU_CASCADER: `${BASE_URL}/api/v1/Menu/CascaderList`,
  //API
  GET_API_LIST: `${BASE_URL}/api/v1/Api`,
  DELETE_API_ITEM: `${BASE_URL}/api/v1/Api`,
  POST_API_ITEM: `${BASE_URL}/api/v1/Api`,
  PUT_API_ITEM: `${BASE_URL}/api/v1/Api`,
  RESOLVE_API_ITEM: `${BASE_URL}/api/v1/Api/Resolve`,
  GET_APIVERSION_SELECTLIST: `${BASE_URL}/api/v1/Api/GetApiVersions`,
  GET_API_CASCADER: `${BASE_URL}/api/v1/Api/CascaderList`,
  //Organize
  GET_ORGANIZE_LIST: `${BASE_URL}/api/v1/Organize`,
  DELETE_ORGANIZE_ITEM: `${BASE_URL}/api/v1/Organize`,
  POST_ORGANIZE_ITEM: `${BASE_URL}/api/v1/Organize`,
  PUT_ORGANIZE_ITEM: `${BASE_URL}/api/v1/Organize`,
  GET_ORGANIZETYPE_SELECTLIST: `${BASE_URL}/api/v1/Organize/OrganizeTypeSelectList`,
  GET_USER_SELECTLIST: `${BASE_URL}/api/v1/Organize/UserSelectList`,
  GET_ORGANIZE_CASCADER: `${BASE_URL}/api/v1/Organize/CascaderList`,
  GET_ORGANIZE_SELECT_TREE: `${BASE_URL}/api/v1/Organize/OrganizeTreeList`,
  //Role
  GET_ROLE_LIST: `${BASE_URL}/api/v1/Role`,
  DELETE_ROLE_ITEM: `${BASE_URL}/api/v1/Role`,
  POST_ROLE_ITEM: `${BASE_URL}/api/v1/Role`,
  PUT_ROLE_ITEM: `${BASE_URL}/api/v1/Role`,
  GET_ROLE_NEXT_SORT_VALUE: `${BASE_URL}/api/v1/Role/GetNextSortValue`,
  GET_ROLE_CASCADER: `${BASE_URL}/api/v1/Role/CascaderList`,
  //Cache
  GET_CACHE_LIST: `${BASE_URL}/api/v1/Cache`,
  DELETE_CACHE_LIST: `${BASE_URL}/api/v1/Cache`,
  //User
  GET_USER_LIST: `${BASE_URL}/api/v1/User`,
  DELETE_USER_ITEM: `${BASE_URL}/api/v1/User`,
  POST_USER_ITEM: `${BASE_URL}/api/v1/User`,
  PUT_USER_ITEM: `${BASE_URL}/api/v1/User`,
};
