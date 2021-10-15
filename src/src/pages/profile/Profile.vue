<template>
  <a-tabs default-active-key="1" tab-position="left" type="card" size="large">
    <a-tab-pane key="1" tab="个人信息">
      <a-card :bordered="false" :loading="loading">
        <detail-list title="用户信息">
          <detail-list-item term="">
            <a-avatar :size="80" icon="user" :src="getUserAvatar(userInfo)" shape="square" />
          </detail-list-item>
          <br />
          <a-divider style="margin-bottom: 32px" />
          <detail-list-item term="用户编号">{{ userInfo.id }}</detail-list-item>
          <detail-list-item term="用户账号">{{ userInfo.userName }}</detail-list-item>
          <detail-list-item term="用户昵称/姓名">{{ userInfo.nickName }}</detail-list-item>
          <detail-list-item term="出生日期">{{ getUserBirthDay(userInfo) }}</detail-list-item>
          <detail-list-item term="地址">{{ userInfo.address }}</detail-list-item>
          <detail-list-item term="性别">{{ getUserGander(userInfo) }}</detail-list-item>
          <detail-list-item term="所在部门">{{ getUserOrganizes(userInfo) }}</detail-list-item>
          <detail-list-item term="用户角色">{{ getUserRoles(userInfo) }}</detail-list-item>
          <detail-list-item term="电话号码">{{ userInfo.phoneNumber }}</detail-list-item>
          <detail-list-item term="号码已验证">
            {{ userInfo.phoneNumber && userInfo.phoneNumber.length > 0 && userInfo.phoneNumberConfirmed ? "是" : "否" }}
          </detail-list-item>
          <detail-list-item term="电子邮箱">{{ userInfo.email }}</detail-list-item>
          <detail-list-item term="邮箱已验证">
            {{ userInfo.email && userInfo.email.length > 0 && userInfo.emailConfirmed ? "是" : "否" }}
          </detail-list-item>
          <detail-list-item term="创建时间">{{ userInfo.createdTime }}</detail-list-item>
        </detail-list>
        <a-divider style="margin-bottom: 32px" />
        <a-button type="primary" icon="edit" @click="edit">
          修改信息
        </a-button>
        <create-form ref="createModal" :visible="visible" :model="mdl" @cancel="cancel" @ok="save" />
      </a-card>
    </a-tab-pane>
    <a-tab-pane key="2" tab="密码修改" force-render>
      <a-card :bordered="false">
        <a-form :form="form" v-bind="formLayout" @submit="handlePwdSubmit">
          <a-form-item v-show="false" label="用户Id">
            <a-input v-decorator="['userid', { rules: [{ required: true, message: '用户Id不能为空!' }] }]" disabled />
          </a-form-item>
          <a-form-item label="旧密码">
            <a-input
              type="password"
              v-decorator="['oldPassword', { rules: [{ required: true, message: '请输入旧密码！' }] }]"
              placeholder="旧密码"
            />
          </a-form-item>
          <a-form-item label="新密码">
            <a-input
              type="password"
              v-decorator="[
                'password',
                { rules: [{ required: true, message: '请输入密码！' }, { validator: validateUserPassword }] },
              ]"
              placeholder="密码"
            />
          </a-form-item>
          <a-form-item label="重复新密码">
            <a-input
              type="password"
              v-decorator="[
                'rePassword',
                { rules: [{ required: true, message: '请再次输入密码！' }, { validator: compareToFirstPassword }] },
              ]"
              placeholder="再次输入密码"
            />
          </a-form-item>

          <a-form-item :wrapper-col="{ span: 12, offset: 5 }">
            <a-button type="primary" icon="save" html-type="submit">
              保存
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
    </a-tab-pane>
  </a-tabs>
</template>

<script>
import moment from "moment";
import { PUT_USER_PWSSWORD, GET_USER_INFO, PUT_USER_ITEM } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import sha256 from "js-sha256";
import { mapState } from "vuex";
import DetailList from "../../components/tool/DetailList";
import PageLayout from "../../layouts/PageLayout";
import CreateForm from "../user/modules/CreateForm";

const DetailListItem = DetailList.Item;

export default {
  name: "Profile",
  components: { PageLayout, DetailListItem, DetailList, CreateForm },
  i18n: require("./i18n"),
  data() {
    this.formLayout = {
      labelCol: {
        xs: { span: 5 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 18 },
        sm: { span: 18 },
        md: { span: 12 },
        lg: { span: 12 },
        xl: { span: 8 },
      },
    };
    return {
      fields: ["userid", "oldPassword", "password", "rePassword"],
      form: this.$form.createForm(this),
      //卡片
      loading: false,
      userInfo: {},
      //修改弹窗
      visible: false,
      mdl: null,
    };
  },
  authorize: {
    //deleteRecord: "delete",
  },
  created() {
    this.fields.forEach((v) => this.form.getFieldDecorator(v));
    this.form.setFieldsValue({ userid: this.user.id });
    this.load();
  },
  computed: {
    ...mapState("account", ["user"]),
  },
  methods: {
    load() {
      this.loading = true;
      request(`${GET_USER_INFO}/${this.user.id}`, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.userInfo = result.data.data;
        this.loading = false;
      });
    },
    edit() {
      this.visible = true;
      this.$nextTick(() => {
        this.mdl = { type: "update", hidePwd: true, data: this.userInfo };
      });
    },
    save() {
      const form = this.$refs.createModal.form;
      this.$refs.createModal.loading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          //设置角色
          let sourceRoles = this.$refs.createModal.roleSelect;
          if (!sourceRoles || sourceRoles.length == 0) {
            this.$message.warning("用户角色不能为空");
            this.$refs.createModal.loading = false;
            return;
          }
          let userRoles = [];
          for (let i = 0; i < sourceRoles.length; i++) {
            userRoles.push(sourceRoles[i].value);
          }
          values.userRoles = userRoles;
          //设置组织机构
          let sourceOrganizes = this.$refs.createModal.organizeSelect;
          if (!sourceOrganizes || sourceOrganizes.length == 0) {
            this.$message.warning("用户组织不能为空");
            this.$refs.createModal.loading = false;
            return;
          }
          let userOrganizes = [];
          for (let i = 0; i < sourceOrganizes.length; i++) {
            userOrganizes.push(sourceOrganizes[i].value);
          }
          values.userOrganizes = userOrganizes;
          //密码加密
          if (values.password && values.password.length > 0) {
            values.password = sha256.sha256(values.password);
          }
          values.PasswordHashed = true;
          // 修改 e.g.
          request(PUT_USER_ITEM, METHOD.PUT, values)
            .then((result) => {
              if (result.data.code != 0) {
                this.$refs.createModal.loading = false;
                return;
              }
              this.load();
              this.visible = false;
              this.$refs.createModal.loading = false;
              // 重置表单数据
              form.resetFields();
              this.$message.success("用户修改成功");
            })
            .catch(() => {
              this.$refs.createModal.loading = false;
            });
        } else {
          this.$refs.createModal.loading = false;
        }
      });
    },
    cancel() {
      this.visible = false;
      const form = this.$refs.createModal.form;
      form.resetFields(); // 清理表单数据（可不做）
    },
    getUserAvatar(userInfo) {
      if (!userInfo || !userInfo.avatar || userInfo.avatar.length == 0) {
        return this.user.avatar;
      }
      return userInfo.avatar;
    },
    getUserBirthDay(userInfo) {
      if (!userInfo || !userInfo.birthDay || userInfo.birthDay.length == 0) {
        return "";
      }
      return moment(userInfo.birthDay, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD");
    },
    getUserRoles(userInfo) {
      if (!userInfo || !userInfo.roles || userInfo.roles.length == 0) {
        return "";
      }
      let names = "";
      for (let i = 0; i < userInfo.roles.length; i++) {
        names += i == userInfo.roles.length - 1 ? userInfo.roles[i].name : userInfo.roles[i].name + "，";
      }
      return names;
    },
    getUserOrganizes(userInfo) {
      if (!userInfo || !userInfo.organizes || userInfo.organizes.length == 0) {
        return "";
      }
      let names = "";
      for (let i = 0; i < userInfo.organizes.length; i++) {
        names += i == userInfo.organizes.length - 1 ? userInfo.organizes[i].name : userInfo.organizes[i].name + "，";
      }
      return names;
    },
    getUserGander(userInfo) {
      if (!userInfo || !userInfo.gender || userInfo.gender.length == 0) {
        return "未知";
      }
      switch (userInfo.gender) {
        default:
        case 0:
        case "Unknow": {
          return "未知";
        }
        case 1:
        case "Male": {
          return "男";
        }
        case 2:
        case "Female": {
          return "女";
        }
        case 4:
        case "All": {
          return "其他";
        }
      }
    },
    handlePwdSubmit() {
      const self = this;
      self.form.validateFields((errors, values) => {
        if (!errors) {
          self.$confirm({
            title: "确认更新当前密码吗?",
            onOk() {
              return new Promise((resolve, reject) => {
                return request(PUT_USER_PWSSWORD, METHOD.PUT, {
                  id: values.userid,
                  oldPassword: sha256.sha256(values.oldPassword),
                  password: sha256.sha256(values.password),
                }).then((result) => {
                  let resultData = result.data;
                  if (resultData.code != 0) {
                    reject();
                    return;
                  }
                  resolve();
                  self.$message.success("密码已更新");
                  self.form.setFieldsValue({
                    oldPassword: null,
                    password: null,
                    rePassword: null,
                  });
                });
              }).catch((err) => {
                if (err) console.error(err.message);
              });
            },
            onCancel() {},
          });
        }
      });
    },
    validateUserPassword(rule, value, callback) {
      let pwd = this.form.getFieldValue("password");
      var pwdRegex = new RegExp("(?=.*[0-9])(?=.*[a-zA-Z]).{8,30}");
      if (!pwdRegex.test(pwd)) {
        callback("密码复杂度太低（至少8个字符，且必须包含字母、数字）");
      } else {
        callback();
      }
    },
    compareToFirstPassword(rule, value, callback) {
      const form = this.form;
      if (value && value !== form.getFieldValue("password")) {
        callback("两次输入的密码不相同！");
      } else {
        callback();
      }
    },
  },
};
</script>

<style lang="less">
.title {
  color: @title-color;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}
</style>
