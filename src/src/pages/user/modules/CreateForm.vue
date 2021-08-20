<template>
  <a-modal
    :title="title"
    :width="650"
    :visible="visible"
    :confirmLoading="loading"
    :maskClosable="false"
    @ok="
      () => {
        $emit('ok');
      }
    "
    @cancel="
      () => {
        $emit('cancel');
      }
    "
  >
    <a-spin :spinning="loading">
      <a-form :form="form" v-bind="formLayout">
        <a-form-item v-show="false" label="主键ID">
          <a-input v-decorator="['id', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item v-show="false" label="头像">
          <a-input v-decorator="['avatar', { initialValue: '' }]" disabled />
        </a-form-item>
        <a-row>
          <a-col :span="12">
            <a-form-item label="头像">
              <a-avatar :size="80" icon="user" :src="avatarImgData" shape="square" />
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col" style="margin-top: 56px;margin-left: -130px;">
            <a-button
              type="primary"
              ghost
              size="small"
              icon="upload"
              @click="toggleShowAvatarUploadForm"
              style="margin-right: 5px;"
            >
              上传
            </a-button>
            <a-button type="danger" ghost size="small" icon="delete" @click="cleanAvatarUpload">
              清除
            </a-button>
            <avatarUpload
              field="img"
              @crop-success="cropSuccess"
              v-model="showAvatarUploadForm"
              :width="150"
              :height="150"
              img-format="png"
            ></avatarUpload>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12" class="input-col">
            <a-form-item label="用户账号">
              <a-input v-decorator="['userName', { rules: [{ required: true }] }]" placeholder="账号：如A00001" />
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col">
            <a-form-item label="用户名称">
              <a-input
                v-decorator="['nickName', { rules: [{ required: true, min: 2, message: '名称不能少于两个字！' }] }]"
                placeholder="用户名称"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12" class="input-col">
            <a-form-item label="用户状态">
              <a-select
                v-decorator="['status', { rules: [{ required: true }], initialValue: 'Enable' }]"
                placeholder="用户状态"
              >
                <a-select-option v-for="item in statusSelectList" :key="item.value">
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col">
            <a-form-item label="出生日期">
              <a-date-picker
                v-decorator="['birthDay', { rules: [{ required: false }] }]"
                placeholder="出生日期"
                style="width: 212.2px;"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12" class="input-col">
            <a-form-item label="性别">
              <a-select v-decorator="['gender', { rules: [{ required: false }] }]" placeholder="请选择">
                <a-select-option v-for="item in genderSelectList" :key="item.value">
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col">
            <a-form-item label="地址">
              <a-input v-decorator="['address', { rules: [{ required: false }] }]" placeholder="地址" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-show="noHidePasswordInput">
          <a-col :span="12" class="input-col">
            <a-form-item label="用户密码">
              <a-input
                v-decorator="['password', { rules: [{ required: false, min: 6, message: '用户密码至少6个字符！' }] }]"
                placeholder="修改时为空则不修改"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12" class="input-col">
            <a-form-item label="电话号码">
              <a-input
                v-decorator="[
                  'phoneNumber',
                  { rules: [{ required: false, min: 5, message: '电话不能少于5个字符！' }] },
                ]"
                placeholder="电话号码"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col">
            <a-form-item label="号码已确认">
              <a-switch
                v-decorator="['phoneNumberConfirmed', { valuePropName: 'checked', initialValue: true }]"
                style="margin-left: 10px;"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12" class="input-col">
            <a-form-item label="电子邮箱">
              <a-input
                v-decorator="['email', { rules: [{ required: false, min: 5, message: '邮箱不能少于5个字符！' }] }]"
                placeholder="电子邮箱"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col">
            <a-form-item label="邮箱已确认">
              <a-switch
                v-decorator="['emailConfirmed', { valuePropName: 'checked', initialValue: true }]"
                style="margin-left: 10px;"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row>
          <a-col :span="12" class="input-col">
            <a-form-item label="组织">
              <a-tree-select
                v-model="organizeSelect"
                placeholder="请选择用户组织"
                :tree-data="organizeTreeData"
                :treeCheckable="true"
                :allowClear="true"
                :dropdownMatchSelectWidth="true"
                :getPopupContainer="getPopupContainer"
                :showCheckedStrategy="SHOW_ALL"
                :treeDefaultExpandAll="true"
                :treeCheckStrictly="true"
                :replaceFields="{ children: 'children', title: 'name', value: 'id' }"
                @change="onOrganizeSelected"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12" class="input-col">
            <a-form-item label="角色">
              <a-tree-select
                v-model="roleSelect"
                placeholder="请选择用户角色"
                :tree-data="roleTreeData"
                :treeCheckable="true"
                :allowClear="true"
                :dropdownMatchSelectWidth="true"
                :getPopupContainer="getPopupContainer"
                :showCheckedStrategy="SHOW_ALL"
                :treeDefaultExpandAll="true"
                :treeCheckStrictly="true"
                :replaceFields="{ children: 'children', title: 'name', value: 'id' }"
                @change="onRoleSelected"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from "lodash.pick";
import moment from "moment";
import { GET_ORGANIZE_CASCADER, GET_ROLE_CASCADER, GET_USER_STATUS, GET_USER_GENDER } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import imgUpload from "vue-image-crop-upload/upload-2.vue";
import { TreeSelect } from "ant-design-vue";
const SHOW_ALL = TreeSelect.SHOW_PARENT;

export default {
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    model: {
      type: Object,
      default: () => null,
    },
  },
  components: {
    avatarUpload: imgUpload,
  },
  data() {
    this.formLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 17 },
    };
    return {
      title: "创建用户",
      fields: [
        "id",
        "avatar",
        "userName",
        "nickName",
        "status",
        "birthDay",
        "gender",
        "address",
        "phoneNumber",
        "phoneNumberConfirmed",
        "email",
        "emailConfirmed",
      ],
      loading: false,
      SHOW_ALL,
      form: this.$form.createForm(this),
      //头像
      showAvatarUploadForm: false,
      avatarImgData: "",
      //organize tree data
      organizeSelect: [],
      organizeTreeData: [],
      //role tree data
      roleSelect: [],
      roleTreeData: [],
      //状态下拉框
      statusSelectList: [],
      //识别下拉框
      genderSelectList: [],
      noHidePasswordInput: true,
    };
  },
  created() {
    // 防止表单未注册
    this.fields.forEach((v) => this.form.getFieldDecorator(v));
    // 当 model 发生改变时，为表单设置值
    this.$watch("model", () => {
      if (!this.model) {
        this.$message.warning("加载表单数据失败");
        return;
      }
      //pick 从model中取出表单中对应值
      if (this.model.type === "update" || this.model.type === "view") {
        this.title = "编辑用户";
        //编辑用户时，是否隐藏修改密码
        if (this.model.hidePwd && this.model.hidePwd === true) {
          this.noHidePasswordInput = false;
        }
        if (this.model.data.birthDay && this.model.data.birthDay.length > 0) {
          this.model.data.birthDay = moment(this.model.data.birthDay, "YYYY-MM-DD HH:mm:ss");
        }
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.title = "创建用户";
        this.load();
      }
    });
  },
  watch: {
    avatarImgData(value) {
      this.form.setFieldsValue({ avatar: value });
    },
  },
  methods: {
    load() {
      this.organizeSelect = [];
      this.organizeTreeData = [];
      this.roleSelect = [];
      this.roleTreeData = [];
      this.avatarImgData = "";
      this.loading = true;
      //如果是更新，设置头像
      if (this.model.type === "update") {
        this.avatarImgData = this.model.data.avatar;
      }
      request(GET_ORGANIZE_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.organizeTreeData = resultData.data;
        if (
          (this.model.type === "update" || this.model.type === "view") &&
          this.model.data.organizes &&
          this.model.data.organizes.length > 0
        ) {
          let modelOrganizes = [];
          for (let i = 0; i < this.model.data.organizes.length; i++) {
            modelOrganizes.push(this.model.data.organizes[i].id);
          }
          if (modelOrganizes.length > 0) {
            this.searchSelectItem(this.organizeTreeData, modelOrganizes, this.organizeSelect);
          }
        }
        request(GET_ROLE_CASCADER, METHOD.GET).then((roleResult) => {
          let resultData = roleResult.data;
          if (resultData.code != 0) {
            return;
          }
          this.roleTreeData = resultData.data;
          if (
            (this.model.type === "update" || this.model.type === "view") &&
            this.model.data.roles &&
            this.model.data.roles.length > 0
          ) {
            let modelRoles = [];
            for (let i = 0; i < this.model.data.roles.length; i++) {
              modelRoles.push(this.model.data.roles[i].id);
            }
            if (modelRoles.length > 0) {
              this.searchSelectItem(this.roleTreeData, modelRoles, this.roleSelect);
            }
          }
          request(GET_USER_STATUS, METHOD.GET).then((statusResult) => {
            if (statusResult.data.code != 0) {
              return;
            }
            this.statusSelectList.splice(0);
            statusResult.data.data.forEach((r) => {
              this.statusSelectList.push(r);
            });
            request(GET_USER_GENDER, METHOD.GET).then((genderResult) => {
              if (genderResult.data.code != 0) {
                return;
              }
              this.genderSelectList.splice(0);
              genderResult.data.data.forEach((r) => {
                this.genderSelectList.push(r);
              });
              this.loading = false;
            });
          });
        });
      });
    },
    toggleShowAvatarUploadForm() {
      this.showAvatarUploadForm = !this.showAvatarUploadForm;
    },
    cleanAvatarUpload() {
      this.cropSuccess("", "");
    },
    cropSuccess(avatarImgData, field) {
      this.avatarImgData = avatarImgData;
    },
    getPopupContainer(triggerNode) {
      return triggerNode.parentNode;
    },
    onOrganizeSelected(value, node, extra) {
      //console.log(JSON.stringify(this.organizeSelect));
    },
    onRoleSelected(value, node, extra) {
      //console.log(JSON.stringify(this.organizeSelect));
    },
    searchSelectItem(source, idArgs, dest) {
      if (!source || source.length == 0) {
        dest = [];
      }
      for (let i = 0; i < source.length; i++) {
        if (idArgs.indexOf(source[i].id) >= 0) {
          dest.push({ value: source[i].id, title: source[i].name });
        }
        if (source[i].children && source[i].children.length > 0) {
          this.searchSelectItem(source[i].children, idArgs, dest);
        }
      }
    },
  },
};
</script>

<style lang="less">
.input-col {
  height: 55px;
}
</style>
