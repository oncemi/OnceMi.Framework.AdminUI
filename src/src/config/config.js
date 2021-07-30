// 自定义配置，参考 ./default/setting.config.js，需要自定义的属性在这里配置即可
module.exports = {
  fixedHeader: true,
  fixedTabs: true,
  multiPage: true,
  asyncRoutes: true,
  animate: {
    disabled: true,
    name: "lightSpeed",
    direction: "left",
  },
  configureWebpack: {
    devtool: "source-map",
  },
};
