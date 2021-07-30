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
        <a-form-item label="父组织">
          <template>
            <a-cascader
              :value="organizeIdSelect"
              ref="cascader"
              :options="options"
              change-on-select
              @change="onOrganizeIdSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '名称不能少于两个字！' }] }]"
            placeholder="组织名称"
          />
        </a-form-item>
        <a-form-item label="代码">
          <a-input v-decorator="['code', { rules: [{ required: true }] }]" placeholder="组织机构代码" />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-decorator="['organizeType', { rules: [{ required: true }] }]" placeholder="组织类型">
            <a-select-option v-for="item in organizeTypes" :key="item.value">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人">
          <a-select
            mode="multiple"
            v-decorator="['departLeaders', { rules: [{ required: false }] }]"
            placeholder="可选，当前组织机构的负责人"
            :allowClear="true"
            :labelInValue="false"
            :filterOption="filterSelectOption"
          >
            <a-select-option v-for="item in userSelectList" :key="item.value" :value="item.value">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分管领导">
          <template>
            <a-select
              mode="multiple"
              v-decorator="['headLeaders', { rules: [{ required: false }] }]"
              placeholder="可选，当前组织机构的分管领导"
              :allowClear="true"
              :labelInValue="false"
              :filterOption="filterSelectOption"
            >
              <a-select-option v-for="item in userSelectList" :key="item.value" :value="item.value">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </template>
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
import { GET_ORGANIZE_CASCADER, GET_ORGANIZETYPE_SELECTLIST, GET_USER_SELECTLIST } from "@/services/api";
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
      title: "创建组织机构",
      fields: [
        "id",
        "parentId",
        "name",
        "code",
        "organizeType",
        "departLeaders",
        "headLeaders",
        "description",
        "isEnabled",
      ],
      loading: false,
      form: this.$form.createForm(this),
      organizeIdSelect: [],
      options: [],
      organizeListData: [],
      organizeTypes: [],
      userSelectList: [],
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
        let departLeaders = [];
        for (let i = 0; i < this.model.data.departLeaders.length; i++) {
          departLeaders.push(this.model.data.departLeaders[i].user.id);
        }
        let headLeaders = [];
        for (let i = 0; i < this.model.data.headLeaders.length; i++) {
          headLeaders.push(this.model.data.headLeaders[i].user.id);
        }
        this.model.data.departLeaders = departLeaders;
        this.model.data.headLeaders = headLeaders;

        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.organizeIdSelect = [];
      this.loading = true;
      let self = this;
      request(GET_ORGANIZE_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        self.options.splice(0);
        self.options = resultData.data;
        self.organizeListData.splice(0);
        self.generateOrganizeList(self.options);
        self.setCascader();

        request(GET_ORGANIZETYPE_SELECTLIST, METHOD.GET).then((orgResult) => {
          if (orgResult.data.code != 0) {
            return;
          }
          self.organizeTypes.splice(0);
          orgResult.data.data.forEach((r) => {
            self.organizeTypes.push(r);
          });

          request(GET_USER_SELECTLIST, METHOD.GET).then((userResult) => {
            if (userResult.data.code != 0) {
              return;
            }
            self.userSelectList.splice(0);
            userResult.data.data.forEach((r) => {
              self.userSelectList.push(r);
            });
            //加载完成
            self.loading = false;
          });
        });
      });
    },
    generateOrganizeList(data) {
      for (let i = 0; i < data.length; i++) {
        this.organizeListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateOrganizeList(data[i].children);
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
        for (let i = 0; i < this.organizeListData.length; i++) {
          if (this.organizeListData[i].id === parentId) {
            parentKeys.push(this.organizeListData[i].id);
            parentId = this.organizeListData[i].parentId;
            break;
          }
        }
      } while (parentId != null && parentId > 0);
      if (parentKeys.length > 0) {
        for (let i = parentKeys.length - 1; i >= 0; i--) {
          this.organizeIdSelect.push(parentKeys[i]);
        }
      }
    },
    filterSelectOption(input, option) {
      return option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    },
    onOrganizeIdSelectChange(value) {
      if (value.length >= 8) {
        this.$message.warn("组织机构深度不能超过7级");
        return;
      }
      this.organizeIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
        return;
      }
      this.form.setFieldsValue({ parentId: value[value.length - 1] });
    },
  },
};
</script>
