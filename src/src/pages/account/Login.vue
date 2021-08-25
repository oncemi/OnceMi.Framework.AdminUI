<template>
  <common-layout v-show="loadPage">
    <a-spin :spinning="logging">
      <div class="top">
        <div class="header">
          <img alt="logo" class="logo" src="@/assets/img/logo.png" />
          <span class="title">{{ systemName }}</span>
        </div>
        <div class="desc">基于.NET 5和Vue开发的企业级前后端分离权限管理开发框架</div>
      </div>
      <div class="login">
        <a-form @submit="onSubmit" :form="form">
          <a-tabs size="large" :tabBarStyle="{ textAlign: 'center' }" style="padding: 0 2px;">
            <a-tab-pane tab="账户密码登录" key="1">
              <a-alert
                type="error"
                :closable="true"
                v-show="error"
                :message="error"
                showIcon
                style="margin-bottom: 24px;"
              />
              <a-form-item>
                <a-input
                  autocomplete="autocomplete"
                  size="large"
                  placeholder="账户ID/账户名"
                  v-decorator="['name', { rules: [{ required: true, message: '请输入账户名', whitespace: true }] }]"
                >
                  <a-icon slot="prefix" type="user" />
                </a-input>
              </a-form-item>
              <a-form-item>
                <a-input
                  size="large"
                  placeholder="密码"
                  autocomplete="autocomplete"
                  type="password"
                  v-decorator="['password', { rules: [{ required: true, message: '请输入密码', whitespace: true }] }]"
                >
                  <a-icon slot="prefix" type="lock" />
                </a-input>
              </a-form-item>
            </a-tab-pane>
            <a-tab-pane tab="验证码登录" key="2">
              <a-form-item>
                <a-input size="large" placeholder="电话">
                  <a-icon slot="prefix" type="mobile" />
                </a-input>
              </a-form-item>
              <a-form-item>
                <a-row :gutter="8" style="margin: 0 -4px">
                  <a-col :span="16">
                    <a-input size="large" placeholder="验证码">
                      <a-icon slot="prefix" type="mail" />
                    </a-input>
                  </a-col>
                  <a-col :span="8" style="padding-left: 4px">
                    <a-button style="width: 100%" class="captcha-button" size="large">获取验证码</a-button>
                  </a-col>
                </a-row>
              </a-form-item>
            </a-tab-pane>
          </a-tabs>
          <div>
            <a-checkbox v-model="isRemember">记住密码</a-checkbox>
            <a style="float: right">忘记密码</a>
          </div>
          <a-form-item>
            <a-button
              :loading="logging"
              style="width: 100%;margin-top: 24px"
              size="large"
              htmlType="submit"
              type="primary"
              >登录</a-button
            >
          </a-form-item>
          <div>
            其他登录方式
            <a-icon class="icon" type="alipay-circle" />
            <a-icon class="icon" type="taobao-circle" />
            <a-icon class="icon" type="weibo-circle" />
            <router-link style="float: right" to="/dashboard/workplace">注册账户</router-link>
          </div>
        </a-form>
      </div>
    </a-spin>
  </common-layout>
</template>

<script>
import CommonLayout from "@/layouts/CommonLayout";
import { getUserRoles, getUserRoutes } from "@/services/user";
import { loadRoutes } from "@/utils/routerUtil";
import { login, localRefreshToken } from "@/services/auth";
import { checkAuthorization } from "@/utils/request";
import { mapState, mapMutations } from "vuex";
import { POST_LOGIN, GETAVATAR } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import { sha256 } from "js-sha256";

export default {
  name: "Login",
  components: { CommonLayout },
  data() {
    return {
      logging: false,
      loadPage: false,
      error: "",
      isRemember: true,
      form: this.$form.createForm(this),
    };
  },
  computed: {
    ...mapState("setting", ["isEnabledIdentityServer", "systemName"]),
    ...mapState("account", ["token"]),
  },
  mounted: async function() {
    if (checkAuthorization()) {
      this.loadRoutes();
    } else {
      if (this.isEnabledIdentityServer) {
        //IdentityServer登录
        login();
      } else {
        //本地认证登录
        this.loadPage = true;
        //是否记住密码
        if (this.token && this.token.refresh_token && this.token.isRemember) {
          let newToken = await localRefreshToken();
          if (newToken) {
            this.loadRoutes();
          }
        }
      }
    }
  },
  methods: {
    ...mapMutations("account", ["setUser", "setToken", "setPermissions", "setRoles"]),
    onSubmit(e) {
      e.preventDefault();
      this.form.validateFields((err) => {
        if (!err) {
          this.logging = true;
          const name = this.form.getFieldValue("name");
          const password = this.form.getFieldValue("password");
          request(POST_LOGIN, METHOD.POST, {
            Username: name,
            Password: sha256.sha256(password),
            Captcha: "123456",
          }).then((result) => {
            if (result.data.code != 0) {
              this.logging = false;
              return;
            }
            let userToken = {
              access_token: result.data.data.accessToken,
              refresh_token: result.data.data.refreshToken,
              token_type: result.data.data.tokenType,
              expires_at: result.data.data.expiresAt,
              profile: result.data.data.profile,
              isRemember: this.isRemember,
            };
            let userInfo = {
              id: result.data.data.profile.id,
              name: result.data.data.profile.userName,
              nickName: result.data.data.profile.nickName,
              avatar: result.data.data.profile.avatar,
              address: result.data.data.profile.address,
              position: {
                CN: "未知",
                HK: "未知",
                US: "Unknow",
              },
            };
            if (userInfo.avatar == null || userInfo.avatar == "") {
              userInfo.avatar = GETAVATAR + "/" + userInfo.name;
            }
            //set user info
            this.setUser(userInfo);
            //set token
            this.setToken(userToken);
            this.afterLogin();
          });
        }
      });
    },
    afterLogin: function() {
      this.logging = false;
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
              this.logging = true;
              loadRoutes(result1.data.data);
              const redirect = this.$route.query?.redirect ? this.$route.query.redirect : "/dashboard/analysis";
              this.$router.push(redirect);
              this.$message.success("登录成功，欢迎回来", 3);
            })
            .catch(function(error) {
              this.loginFailed(error);
            });
        })
        .catch((error) => {
          this.loginFailed(error);
        });
    },
    loginFailed: function(error) {
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
    loadRoutes() {
      let self = this;
      getUserRoutes()
        .then((result) => {
          loadRoutes(result.data.data);
          const redirect = self.$route.query?.redirect ? self.$route.query.redirect : "/dashboard/analysis";
          self.$router.push(redirect);
        })
        .catch(function(error) {
          console.error(error);
          self.$router.push("/403");
        });
    },
  },
};
</script>

<style lang="less" scoped>
.common-layout {
  .top {
    text-align: center;
    .header {
      height: 44px;
      line-height: 44px;
      a {
        text-decoration: none;
      }
      .logo {
        height: 44px;
        vertical-align: top;
        margin-right: 16px;
      }
      .title {
        font-size: 33px;
        color: @title-color;
        font-family: "Myriad Pro", "Helvetica Neue", Arial, Helvetica, sans-serif;
        font-weight: 600;
        position: relative;
        top: 2px;
      }
    }
    .desc {
      font-size: 14px;
      color: @text-color-second;
      margin-top: 12px;
      margin-bottom: 40px;
    }
  }
  .login {
    width: 368px;
    margin: 0 auto;
    @media screen and (max-width: 576px) {
      width: 95%;
    }
    @media screen and (max-width: 320px) {
      .captcha-button {
        font-size: 14px;
      }
    }
    .icon {
      font-size: 24px;
      color: @text-color-second;
      margin-left: 16px;
      vertical-align: middle;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: @primary-color;
      }
    }
  }
}
</style>
