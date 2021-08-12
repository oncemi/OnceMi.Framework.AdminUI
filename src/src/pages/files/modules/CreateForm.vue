<template>
  <a-modal
    :title="title"
    :width="550"
    :visible="visible"
    :confirmLoading="loading"
    :maskClosable="false"
    :footer="null"
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
        <a-form-item v-show="false" label="用户Id">
          <a-input v-decorator="['userId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="访问权限（暂不支持）：">
          <a-select
            v-decorator="['accessMode', { rules: [{ required: true, initialValue: 'PublicRead' }] }]"
            placeholder="请选择"
            @change="onTypeChange"
          >
            <a-select-option v-for="item in typeSelectList" :key="item.value">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-upload-dragger
          name="file"
          :multiple="true"
          :action="POST_FILE_ITEM"
          :data="(file) => uploadDataParam(file)"
          :headers="uploadHeader()"
          :file-list="fileList"
          :withCredentials="true"
          :remove="(file) => remove(file)"
          @change="handleChange"
        >
          <p class="ant-upload-drag-icon">
            <a-icon type="inbox" />
          </p>
          <p class="ant-upload-text">
            选择或拖动文件到此区域上传
          </p>
        </a-upload-dragger>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from "lodash.pick";
import { GET_FILE_ACCESSMODE_SELECTLIST, POST_FILE_ITEM, DELETE_FILE_ITEM } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import { getUser } from "@/services/auth";

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
  data() {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 9 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 },
      },
    };
    return {
      title: "上传文件",
      fields: ["id", "userId", "accessMode"],
      loading: false,
      POST_FILE_ITEM,
      form: this.$form.createForm(this),
      //type select
      typeSelectList: [],
      accessToken: "",
      //upload list
      fileList: [],
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
      if (this.model.type === "update") {
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.load();
      }
    });
  },
  async mounted() {
    let userInfo = await getUser();
    this.accessToken = userInfo.access_token;
  },
  methods: {
    load() {
      this.loading = true;
      this.fileList = [];
      request(GET_FILE_ACCESSMODE_SELECTLIST, METHOD.GET).then((orgResult) => {
        if (orgResult.data.code != 0) {
          return;
        }
        this.typeSelectList.splice(0);
        orgResult.data.data.forEach((r) => {
          this.typeSelectList.push(r);
        });
        this.loading = false;
      });
    },
    handleChange(info) {
      const status = info.file.status;
      if (status === "done") {
        this.$message.success(`【${info.file.name}】上传成功`);
      } else if (status === "error") {
        this.$message.error(`【${info.file.name}】上传失败`);
      }
      let fileList = [...info.fileList];
      fileList = fileList.map((file) => {
        if (file.response) {
          // Component will show file.url as link
          file.url = file.response.url;
        }
        return file;
      });

      this.fileList = fileList;
    },
    uploadDataParam(file) {
      if (!file) {
        return;
      }
      let accessMode = this.form.getFieldValue("accessMode");
      if (!accessMode || accessMode.length == 0) {
        this.$message.warning(`请选择文件访问权限`);
        return;
      }
      let userId = this.form.getFieldValue("userId");
      return {
        accessMode: accessMode,
        userId: userId,
      };
    },
    uploadHeader() {
      return {
        Authorization: "Bearer " + this.accessToken,
      };
    },
    remove(file) {
      let id = file.response?.data[0]?.id;
      if (file.response?.code != 0 || !id || id == 0) {
        return false;
      }
      let delArgs = [id];
      return new Promise((resolve, reject) => {
        return request(DELETE_FILE_ITEM, METHOD.DELETE, delArgs).then((result) => {
          let resultData = result.data;
          if (resultData.code != 0) {
            reject(false);
            return;
          }
          resolve();
          this.$message.success(`移除文件【${file.name}】成功`);
        });
      }).catch((err) => {
        this.$message.error(err.message);
        console.error(err);
      });
    },
    onTypeChange(value) {
      //
    },
  },
};
</script>
