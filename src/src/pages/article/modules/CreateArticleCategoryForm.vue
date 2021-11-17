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
        <a-form-item label="上级分组">
          <template>
            <a-cascader
              :value="categoryIdSelect"
              ref="cascader"
              :options="options"
              change-on-select
              @change="onCategoryIdSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="分组名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '分组名称不能少于两个字！' }] }]"
            placeholder="分组名称"
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
import { GET_ARTICLECATEGORY_CASCADER } from "@/services/api";
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
      title: "创建文章分类",
      fields: ["id", "parentId", "name", "description", "isEnabled"],
      loading: false,
      form: this.$form.createForm(this),
      categoryIdSelect: [],
      options: [],
      categoryListData: [],
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
        this.title = "编辑文章分类";
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.title = "新建文章分类";
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.categoryIdSelect = [];
      this.loading = true;
      let self = this;
      request(GET_ARTICLECATEGORY_CASCADER, METHOD.GET)
        .then((result) => {
          if (result.data.code != 0) {
            return;
          }
          self.options.splice(0);
          self.options = result.data.data;
          self.categoryListData.splice(0);
          self.generateCategoryList(self.options);
          this.setCascader("parentId", this.categoryListData, this.categoryIdSelect);
          this.loading = false;
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    },
    generateCategoryList(data) {
      for (let i = 0; i < data.length; i++) {
        this.categoryListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateCategoryList(data[i].children);
        }
      }
    },
    onCategoryIdSelectChange(value) {
      if (value.length >= 8) {
        this.$message.warning("组织机构深度不能超过7级");
        return;
      }
      this.categoryIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
        return;
      }
      this.form.setFieldsValue({ parentId: value[value.length - 1] });
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
  },
};
</script>
