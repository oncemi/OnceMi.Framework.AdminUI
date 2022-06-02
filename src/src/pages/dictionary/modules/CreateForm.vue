<template>
  <a-modal
    :title="title"
    :width="550"
    :visible="visible"
    :confirmLoading="loading"
    :maskClosable="false"
    :destroyOnClose="true"
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
        <a-form-item label="上级字典">
          <template>
            <a-cascader
              :value="dictionaryIdSelect"
              ref="cascader"
              :options="options"
              change-on-select
              @change="onDictionaryIdSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="字典名称">
          <a-input v-decorator="['name', { rules: [{ required: true }] }]" placeholder="字典名称" />
        </a-form-item>
        <a-form-item label="字典编码">
          <a-input v-decorator="['code', { rules: [{ required: true }] }]" placeholder="字典编码" />
        </a-form-item>
        <a-form-item label="字典值">
          <a-input v-decorator="['value', { rules: [{ required: false }] }]" placeholder="字典值" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number
            v-decorator="['sort', { initialValue: 1 }]"
            :min="1"
            :max="999999999999"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="描述/备注">
          <a-input
            v-decorator="['description', { rules: [{ required: false, min: 2, message: '描述不能少于两个字！' }] }]"
            placeholder="可选，描述"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-decorator="['isEnabled', { valuePropName: 'checked', initialValue: true }]" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from "lodash.pick";
import { GET_DICTIONARY_CASCADER, GET_DICTIONARY_NEXT_SORT_VALUE } from "@/services/api";
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
      title: "新建数据字典",
      fields: ["id", "parentId", "name", "code", "value", "sort", "description", "isEnabled"],
      loading: false,
      form: this.$form.createForm(this),
      dictionaryIdSelect: [],
      options: [],
      dictionaryListData: [],
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
      this.title = this.model.type === "update" ? "编辑数据字典" : "新建数据字典";
      if (this.model.data) {
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
        if (this.model.data.parentId && this.model.data.parentId > 0) {
          this.loadMaxSort(this.model.data.parentId);
        }
      } else {
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.dictionaryIdSelect = [];
      this.loading = true;
      let self = this;
      request(GET_DICTIONARY_CASCADER, METHOD.GET)
        .then((result) => {
          if (result.data.code != 0) {
            return;
          }
          self.options.splice(0);
          self.options = result.data.data;
          self.dictionaryListData.splice(0);
          self.generateDictionaryList(self.options);
          self.setCascader();

          this.loading = false;
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    },
    loadMaxSort(parentId) {
      if (!parentId || parentId == 0) {
        this.form.setFieldsValue({ sort: 1 });
        return;
      }
      request(GET_DICTIONARY_NEXT_SORT_VALUE, METHOD.GET, { parentId: parentId }).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.form.setFieldsValue({ sort: result.data.data });
      });
    },
    generateDictionaryList(data) {
      for (let i = 0; i < data.length; i++) {
        this.dictionaryListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateDictionaryList(data[i].children);
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
        for (let i = 0; i < this.dictionaryListData.length; i++) {
          if (this.dictionaryListData[i].id === parentId) {
            parentKeys.push(this.dictionaryListData[i].id);
            parentId = this.dictionaryListData[i].parentId;
            break;
          }
        }
      } while (parentId != null && parentId > 0);
      if (parentKeys.length > 0) {
        for (let i = parentKeys.length - 1; i >= 0; i--) {
          this.dictionaryIdSelect.push(parentKeys[i]);
        }
      }
    },
    onDictionaryIdSelectChange(value) {
      if (value.length >= 8) {
        this.$message.warning("字典深度不能超过7级");
        return;
      }
      this.dictionaryIdSelect = value;
      let parentId = 0;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
      } else {
        parentId = value[value.length - 1];
        this.form.setFieldsValue({ parentId: parentId });
      }
      this.loadMaxSort(parentId);
    },
  },
};
</script>
