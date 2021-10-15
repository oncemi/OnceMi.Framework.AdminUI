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
        <a-form-item label="上级角色">
          <template>
            <a-cascader
              :value="roleIdSelect"
              ref="cascader"
              :options="roleOptions"
              change-on-select
              @change="onRoleSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '名称不能少于两个字！' }] }]"
            placeholder="角色名称"
          />
        </a-form-item>
        <a-form-item label="角色编码">
          <a-input v-decorator="['code', { rules: [{ required: true }] }]" placeholder="角色编码" />
        </a-form-item>
        <a-form-item v-show="false" label="组织机构Id">
          <a-input v-decorator="['organizeId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="组织机构">
          <template>
            <a-cascader
              :value="organizeIdSelect"
              ref="cascader"
              :options="organizeOptions"
              change-on-select
              @change="onOrganizeSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择组织机构"
            />
          </template>
        </a-form-item>
        <a-form-item label="排序">
          <a-input v-decorator="['sort', { rules: [{ required: false }] }]" placeholder="排序" />
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
import { GET_ROLE_CASCADER, GET_ORGANIZE_CASCADER, GET_ROLE_NEXT_SORT_VALUE } from "@/services/api";
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
      title: "创建角色",
      fields: ["id", "parentId", "name", "code", "organizeId", "sort", "isEnabled"],
      loading: false,
      form: this.$form.createForm(this),
      roleIdSelect: [],
      roleOptions: [],
      roleListData: [],
      organizeIdSelect: [],
      organizeOptions: [],
      organizeListData: [],
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
        this.title = "编辑角色";
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.title = "创建角色";
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.roleIdSelect = [];
      this.organizeIdSelect = [];
      this.loading = true;

      request(GET_ROLE_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.roleOptions.splice(0);
        this.roleOptions = resultData.data;
        this.roleListData.splice(0);
        this.generateRoleList(this.roleOptions);
        this.setCascader("parentId", this.roleListData, this.roleIdSelect);

        request(GET_ORGANIZE_CASCADER, METHOD.GET).then((orgResult) => {
          let resultData = orgResult.data;
          if (resultData.code != 0) {
            return;
          }
          this.organizeOptions.splice(0);
          this.organizeOptions = resultData.data;
          this.organizeListData.splice(0);
          this.generateOrganizeList(this.organizeOptions);
          this.setCascader("organizeId", this.organizeListData, this.organizeIdSelect);

          this.loading = false;
        });
      });
    },
    loadRoleMaxSort(parentId) {
      if (!parentId) {
        this.form.setFieldsValue({ sort: 1 });
        return;
      }
      request(GET_ROLE_NEXT_SORT_VALUE, METHOD.GET, { parentId: parentId }).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.form.setFieldsValue({ sort: result.data.data });
      });
    },
    generateRoleList(data) {
      for (let i = 0; i < data.length; i++) {
        this.roleListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateRoleList(data[i].children);
        }
      }
    },
    generateOrganizeList(data) {
      for (let i = 0; i < data.length; i++) {
        this.organizeListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateOrganizeList(data[i].children);
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
    onRoleSelectChange(value) {
      if (value.length >= 5) {
        this.$message.warning("角色树深度不能超过5层");
        return;
      }
      this.roleIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
        return;
      }
      let parentId = value[value.length - 1];
      this.form.setFieldsValue({ parentId: parentId });
      //新增，自动获取排序
      if (this.model.type === "create") {
        this.loadRoleMaxSort(parentId);
      }
    },
    onOrganizeSelectChange(value) {
      this.organizeIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ organizeId: 0 });
        return;
      }
      this.form.setFieldsValue({ organizeId: value[value.length - 1] });
    },
  },
};
</script>
