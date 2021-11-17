<template>
  <div></div>
</template>
<script>
import { userManager } from "@/services/auth";
import { getUserRoutes, getUserInfo, getUserRoles } from "@/services/user";
import { loadRoutes } from "@/utils/routerUtil";
import { mapMutations } from "vuex";

export default {
  name: "Callback",
  data() {
    return {
      error: "",
    };
  },
  async created() {
    userManager.signinRedirectCallback().then(
      async (userToken) => {
        window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
        if (!userToken) {
          this.$router.push("/500");
          this.error = "登录失败，获取用户信息失败！";
          return;
        }
        console.log(JSON.stringify(userToken));
        //set token
        this.setToken(userToken);
        //set user info
        getUserInfo().then((result) => {
          this.setUser(result);
        });
        this.afterLogin();
      },
      (err) => {
        console.log("Error caught in signinRedirectCallback().");
        console.error(err);
      }
    );
  },
  methods: {
    ...mapMutations("account", ["setUser", "setToken", "setPermissions", "setRoles"]),
    afterLogin: function () {
      //获取权限配置，基于角色的
      getUserRoles()
        .then((result) => {
          if (!result.data || result.data.code != 0) {
            this.loginFailed(null);
            return;
          }
          this.setRoles(result.data.data);
          // 获取路由配置
          getUserRoutes()
            .then((result1) => {
              if (!result1.data || result1.data.code != 0) {
                this.loginFailed(null);
                return;
              }
              loadRoutes(result1.data.data);
              const redirect = this.$route.query?.redirect ? this.$route.query.redirect : "/dashboard/index";
              this.$router.push(redirect);
              this.$message.success("登录成功，欢迎回来", 3);
            })
            .catch(function (error) {
              this.loginFailed(error);
            });
        })
        .catch((error) => {
          this.loginFailed(error);
        });
    },
    loginFailed: function (error) {
      if (error.response && error.response.status == 403) {
        this.$router.push("/403");
        this.$message.warning("登录失败，您没有访问此页面的权限！");
      } else {
        this.$router.push("/500");
        if (error.data && error.data.code != 0) {
          this.$message.warning(error.data.message);
        } else {
          this.$message.warning("登陆失败");
        }
      }
    },
  },
};
</script>
