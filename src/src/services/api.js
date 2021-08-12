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
  PUT_USER_PWSSWORD: `${BASE_URL}/api/v1/User/UpdateUserPassword`,
  GET_USER_STATUS: `${BASE_URL}/api/v1/User/UserStatusSelectList`,
  GET_USER_GENDER: `${BASE_URL}/api/v1/User/UserGenderSelectList`,
  //Job
  GET_JOB_LIST: `${BASE_URL}/api/v1/Job`,
  DELETE_JOB_ITEM: `${BASE_URL}/api/v1/Job`,
  POST_JOB_ITEM: `${BASE_URL}/api/v1/Job`,
  PUT_JOB_ITEM: `${BASE_URL}/api/v1/Job`,
  POST_START_JOB: `${BASE_URL}/api/v1/Job/Start`,
  POST_STOP_JOB: `${BASE_URL}/api/v1/Job/Stop`,
  POST_PAUSE_JOB: `${BASE_URL}/api/v1/Job/Pause`,
  POST_RESUME_JOB: `${BASE_URL}/api/v1/Job/Resume`,
  POST_TRIGGER_JOB: `${BASE_URL}/api/v1/Job/Trigger`,
  //JobGroup
  GET_JOB_GROUP_LIST: `${BASE_URL}/api/v1/JobGroup`,
  DELETE_JOB_GROUP_ITEM: `${BASE_URL}/api/v1/JobGroup`,
  POST_JOB_GROUP_ITEM: `${BASE_URL}/api/v1/JobGroup`,
  PUT_JOB_GROUP_ITEM: `${BASE_URL}/api/v1/JobGroup`,
  GET_JOB_GROUP_SELECT_LIST: `${BASE_URL}/api/v1/JobGroup/SelectList`,
  //JobHistory
  GET_JOB_HISTORY_LIST: `${BASE_URL}/api/v1/JobHistory`,
  //Dictionary
  GET_DICTIONARY_TREE: `${BASE_URL}/api/v1/Dictionary/DictionaryTreeList`,
  GET_DICTIONARY_ITEM: `${BASE_URL}/api/v1/Dictionary/Detail`,
  DELETE_DICTIONARY_ITEM: `${BASE_URL}/api/v1/Dictionary`,
  POST_DICTIONARY_ITEM: `${BASE_URL}/api/v1/Dictionary`,
  PUT_DICTIONARY_ITEM: `${BASE_URL}/api/v1/Dictionary`,
  GET_DICTIONARY_CASCADER: `${BASE_URL}/api/v1/Dictionary/CascaderList`,
  GET_DICTIONARY_NEXT_SORT_VALUE: `${BASE_URL}/api/v1/Dictionary/GetNextSortValue`,
  //File
  GET_FILE_LIST: `${BASE_URL}/api/v1/File/QueryByPage`,
  POST_FILE_ITEM: `${BASE_URL}/api/v1/File`,
  DELETE_FILE_ITEM: `${BASE_URL}/api/v1/File`,
  GET_FILE_ACCESSMODE_SELECTLIST: `${BASE_URL}/api/v1/File/AccessModeSelectList`,
};
