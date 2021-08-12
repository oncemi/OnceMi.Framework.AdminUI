<template>
  <div></div>
</template>
<script>
import { userManager } from "@/services/auth";
import { getUserRoutes, getUserInfo, getUserRoles } from "@/services/user";
import { setAuthorization } from "@/utils/request";
import { loadRoutes } from "@/utils/routerUtil";
import { mapMutations } from "vuex";

export default {
  name: "Callback",
  data() {
    return {
      logging: false,
      error: "",
    };
  },
  async created() {
    let self = this;
    userManager.signinRedirectCallback().then(
      function(user) {
        window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
        if (!user) {
          this.$router.push("/500");
          this.error = "登录失败，获取用户信息失败！";
          return;
        }
        //console.log(JSON.stringify(user));
        //设置请求认证
        setAuthorization(user);
        self.afterLogin();
      },
      (err) => {
        console.log("Error caught in signinRedirectCallback().");
        console.error(err);
      }
    );
  },
  methods: {
    ...mapMutations("account", ["setUser", "setPermissions", "setRoles"]),
    afterLogin: async function() {
      let self = this;
      this.logging = false;
      //set user info
      this.setUser(await getUserInfo());
      //获取权限配置，基于角色的
      getUserRoles()
        .then((result) => {
          if (result.data && result.data.code == 0) {
            this.setRoles(result.data.data);
            // 获取路由配置
            getUserRoutes()
              .then((result1) => {
                if (result1.data && result1.data.code == 0) {
                  this.logging = true;
                  loadRoutes(result1.data.data);
                  const redirect = self.$route.query?.redirect ? self.$route.query.redirect : "/dashboard/analysis";
                  self.$router.push(redirect);
                  self.$message.success("登录成功，欢迎回来", 3);
                } else {
                  self.$router.push("/500");
                  self.$message.warning(`登录失败，${result1.data.message}`);
                }
              })
              .catch(function(error) {
                self.loginFailed(error);
              });
          } else {
            self.$router.push("/500");
            self.$message.warning(`登录失败，${result.data.message}`);
          }
        })
        .catch((error) => {
          self.loginFailed(error);
        });
    },
    loginFailed: function(error) {
      if (error.response && error.response.status == 403) {
        self.$router.push("/403");
        self.$message.warning("登录失败，您没有访问此页面的权限！");
      } else {
        self.$router.push("/500");
        if (error.data && error.data.code != 0) {
          self.$message.warning(error.data.message);
        } else {
          self.$message.warning("登陆失败");
        }
      }
    },
  },
};
</script>
