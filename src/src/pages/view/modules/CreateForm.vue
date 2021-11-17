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
        <a-form-item label="上级视图">
          <template>
            <a-cascader
              :value="viewIdSelect"
              ref="cascader"
              :options="options"
              change-on-select
              @change="onViewSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '名称不能少于两个字！' }] }]"
            placeholder="视图名称"
          />
        </a-form-item>
        <a-form-item label="路由">
          <a-input v-decorator="['router', { rules: [{ required: true }] }]" placeholder="路由" />
        </a-form-item>
        <a-form-item label="路径">
          <a-input
            v-decorator="['path', { rules: [{ required: false }] }]"
            placeholder="可选，视图路径，如：/home/dashboard"
          />
        </a-form-item>
        <a-form-item label="路由参数">
          <a-input
            v-decorator="['query', { rules: [{ required: false }] }]"
            placeholder='可选，参数(Json格式)，如：{"id":"1"}'
          />
        </a-form-item>
        <a-form-item label="页面标题">
          <a-input
            v-decorator="['pageTitle', { rules: [{ required: false }] }]"
            placeholder="可选，不填则使用菜单名称"
          />
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
import { GET_VIEW_CASCADER } from "@/services/api";
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
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 },
      },
    };
    return {
      title: "创建视图",
      fields: ["id", "parentId", "path", "name", "router", "query", "pageTitle", "description", "isEnabled"],
      loading: false,
      form: this.$form.createForm(this),
      viewIdSelect: [],
      options: [],
      viewListData: [],
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
        this.title = "编辑视图";
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.title = "创建视图";
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.viewIdSelect = [];
      this.loading = true;
      request(GET_VIEW_CASCADER, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.options.splice(0);
        this.options = result.data.data;
        this.loading = false;
        this.viewListData.splice(0);
        this.generateViewList(this.options);
        this.setCascader("parentId", this.viewListData, this.viewIdSelect);
      });
    },
    generateViewList(data) {
      for (let i = 0; i < data.length; i++) {
        this.viewListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateViewList(data[i].children);
        }
      }
    },
    setCascader(fieldName, data, selectList) {
      let parentId = this.form.getFieldValue(fieldName);
      if (!parentId || parentId <= 0) {
        return;
      }
      let parentKeys = [];
      do {
        for (let i = 0; i < data.length; i++) {
          if (data[i].id === parentId) {
            parentKeys.push(data[i].id);
            parentId = data[i].parentId;
            break;
          }
        }
      } while (parentId != null && parentId > 0);
      if (parentKeys.length > 0) {
        for (let i = parentKeys.length - 1; i >= 0; i--) {
          selectList.push(parentKeys[i]);
        }
      }
    },
    onViewSelectChange(value) {
      if (value.length >= 4) {
        this.$message.warning("视图深度不能超过4层");
        return;
      }
      this.viewIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
        return;
      }
      this.form.setFieldsValue({ parentId: value[value.length - 1] });
    },
  },
};
</script>
