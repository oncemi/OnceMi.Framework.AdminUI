<template>
  <a-modal
    :title="title"
    :width="550"
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
        <a-form-item v-show="false" label="父节点Id">
          <a-input v-decorator="['parentId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="上级API">
          <template>
            <a-cascader
              :value="apiIdSelect"
              ref="cascader"
              :options="apiOptions"
              change-on-select
              @change="onApiSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '名称不能少于两个字！' }] }]"
            placeholder="API名称"
          />
        </a-form-item>
        <a-form-item label="版本">
          <a-select v-decorator="['version', { rules: [{ required: true }] }]" placeholder="API版本">
            <a-select-option v-for="item in apiVersionsSelectList" :key="item.value">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="路径">
          <a-input v-decorator="['path', { rules: [{ required: true }] }]" placeholder="API请求路径，如：/home/get" />
        </a-form-item>
        <a-form-item label="请求方式">
          <a-select v-decorator="['method', { rules: [{ required: false }] }]" placeholder="请求方式">
            <a-select-option value="">请选择</a-select-option>
            <a-select-option value="Get">Get</a-select-option>
            <a-select-option value="Post">Post</a-select-option>
            <a-select-option value="Put">Put</a-select-option>
            <a-select-option value="Delete">Delete</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述">
          <a-input
            v-decorator="['description', { rules: [{ required: false, min: 2, message: '描述不能少于两个字！' }] }]"
            placeholder="可选，描述"
          />
        </a-form-item>
        <a-form-item label="是否启用">
          <a-switch v-decorator="['isEnabled', { valuePropName: 'checked', initialValue: true }]" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from "lodash.pick";
import { GET_API_CASCADER, GET_APIVERSION_SELECTLIST } from "@/services/api";
import { request, METHOD } from "@/utils/request";

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
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 },
      },
    };
    return {
      title: "创建接口",
      fields: ["id", "parentId", "name", "version", "method", "path", "description", "isEnabled"],
      loading: false,
      form: this.$form.createForm(this),
      apiIdSelect: [],
      apiOptions: [],
      apiListData: [],
      apiVersionsSelectList: [],
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
      if (this.model.type === "update") {
        this.title = "编辑接口";
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.title = "创建接口";
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.apiIdSelect = [];
      this.loading = true;
      request(GET_API_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.apiOptions.splice(0);
        this.apiOptions = resultData.data;
        this.apiListData.splice(0);
        this.generateApiList(this.apiOptions);
        this.setCascader();
        request(GET_APIVERSION_SELECTLIST, METHOD.GET).then((orgResult) => {
          if (orgResult.data.code != 0) {
            return;
          }
          this.apiVersionsSelectList.splice(0);
          orgResult.data.data.forEach((r) => {
            this.apiVersionsSelectList.push(r);
          });
          this.loading = false;
        });
      });
    },
    generateApiList(data) {
      for (let i = 0; i < data.length; i++) {
        this.apiListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateApiList(data[i].children);
        }
      }
    },
    setCascader() {
      let parentId = this.form.getFieldValue("parentId");
      if (!parentId || parentId <= 0) {
        return;
      }
      let parentKeys = [];
      do {
        for (let i = 0; i < this.apiListData.length; i++) {
          if (this.apiListData[i].id === parentId) {
            parentKeys.push(this.apiListData[i].id);
            parentId = this.apiListData[i].parentId;
            break;
          }
        }
      } while (parentId != null && parentId > 0);
      if (parentKeys.length > 0) {
        for (let i = parentKeys.length - 1; i >= 0; i--) {
          this.apiIdSelect.push(parentKeys[i]);
        }
      }
    },
    onApiSelectChange(value) {
      if (value.length >= 4) {
        this.$message.warning("接口深度不能超过4层");
        return;
      }
      this.apiIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
        return;
      }
      this.form.setFieldsValue({ parentId: value[value.length - 1] });
    },
  },
};
</script>
