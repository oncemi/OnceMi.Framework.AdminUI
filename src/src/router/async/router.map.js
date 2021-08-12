// 视图组件
const view = {
  tabs: () => import("@/layouts/tabs"),
  blank: () => import("@/layouts/BlankView"),
  page: () => import("@/layouts/PageView"),
};

// 路由组件注册
const routerMap = {
  root: {
    path: "/",
    name: "Admin",
    redirect: "/login",
    component: view.tabs,
  },
  dashboard: {
    name: "Dashboard",
    component: view.blank,
  },
  workplace: {
    name: "工作台",
    component: () => import("@/pages/dashboard/workplace"),
  },
  analysis: {
    name: "分析页",
    component: () => import("@/pages/dashboard/analysis"),
  },
  management: {
    name: "系统管理",
    component: view.page,
  },
  organize: {
    name: "接口管理",
    component: () => import("@/pages/organize/Organize"),
  },
  api: {
    name: "接口管理",
    component: () => import("@/pages/api/Api"),
  },
  view: {
    name: "视图管理",
    component: () => import("@/pages/view/View"),
  },
  menu: {
    name: "菜单管理",
    component: () => import("@/pages/menu/Menu"),
  },
  permission: {
    name: "角色权限",
    component: () => import("@/pages/permission/Permission"),
  },
  role: {
    name: "角色管理",
    component: () => import("@/pages/role/Role"),
  },
  user: {
    name: "用户管理",
    component: () => import("@/pages/user/User"),
  },
  cache: {
    name: "缓存管理",
    component: () => import("@/pages/cache/Cache"),
  },
  job: {
    name: "作业管理",
    component: () => import("@/pages/job/Job"),
  },
  dictionary: {
    name: "数据字典",
    component: () => import("@/pages/dictionary/Dictionary"),
  },
  files: {
    name: "文件管理",
    component: () => import("@/pages/files/Files"),
  },
  personal: {
    name: "个人中心",
    component: view.page,
  },
  profile: {
    name: "个人信息",
    component: () => import("@/pages/profile/Profile"),
  },
  exception: {
    name: "异常页",
    icon: "warning",
    component: view.blank,
  },
  callback: {
    name: "callback",
    authority: "*",
    component: () => import("@/pages/account/Callback"),
  },
  refresh: {
    name: "refresh",
    authority: "*",
    component: () => import("@/pages/account/RefreshToken"),
  },
  login: {
    name: "login",
    authority: "*",
    component: () => import("@/pages/account/Login.vue"),
  },
  logout: {
    name: "logout",
    authority: "*",
    component: () => import("@/pages/account/Logout.vue"),
  },
  exp403: {
    authority: "*",
    name: "exp403",
    path: "403",
    component: () => import("@/pages/exception/403"),
  },
  exp404: {
    name: "exp404",
    path: "404",
    component: () => import("@/pages/exception/404"),
  },
  exp500: {
    name: "exp500",
    path: "500",
    component: () => import("@/pages/exception/500"),
  },
};
export default routerMap;
