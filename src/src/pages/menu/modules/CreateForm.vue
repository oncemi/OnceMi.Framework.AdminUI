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
        <a-form-item v-show="false" label="父菜单Id">
          <a-input v-decorator="['parentId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="父菜单">
          <template>
            <a-cascader
              :value="menuIdSelect"
              ref="cascader"
              :options="menuOptions"
              change-on-select
              @change="onMenuIdChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-decorator="['type', { rules: [{ required: true }] }]"
            placeholder="菜单类型"
            @change="onTypeChange"
          >
            <a-select-option v-for="item in typeSelectList" :key="item.value">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-show="false" label="视图Id">
          <a-input v-decorator="['viewId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="视图" v-if="viewOrGroupSelected">
          <template>
            <a-cascader
              :value="viewIdSelect"
              ref="cascader"
              :options="viewOptions"
              change-on-select
              @change="onViewIdChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item v-show="false" label="接口Id">
          <a-input v-decorator="['apiId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="接口" v-if="apiSelected">
          <template>
            <a-cascader
              :value="apiIdSelect"
              ref="cascader"
              :options="apiOptions"
              change-on-select
              @change="onApiIdChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择"
            />
          </template>
        </a-form-item>
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '名称不能少于两个字！' }] }]"
            placeholder="菜单名称"
          />
        </a-form-item>
        <a-form-item v-if="viewOrGroupSelected" label="图标" help="图标查找：https://www.antdv.com/components/icon-cn/">
          <a-input v-decorator="['icon', { initialValue: '' }]" placeholder="请选择图标" />
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
import {
  GET_MENU_CASCADER,
  GET_MENU_TYPES,
  GET_MENU_NEXT_SORT_VALUE,
  GET_VIEW_CASCADER,
  GET_API_CASCADER,
} from "@/services/api";
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
      title: "新建菜单",
      fields: ["id", "parentId", "name", "type", "viewId", "apiId", "sort", "isEnabled", "icon"],
      loading: false,
      form: this.$form.createForm(this),
      //menu select
      menuIdSelect: [],
      menuOptions: [],
      menuListData: [],
      //view select
      viewIdSelect: [],
      viewOptions: [],
      viewListData: [],
      //api select
      apiIdSelect: [],
      apiOptions: [],
      apiListData: [],
      //type select
      typeSelectList: [],
      viewOrGroupSelected: false,
      apiSelected: false,
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
      this.menuIdSelect = [];
      this.viewIdSelect = [];
      this.apiIdSelect = [];
      this.viewOrGroupSelected = false;
      this.apiSelected = false;
      //pick 从model中取出表单中对应值
      if (this.model.type === "update") {
        this.title = "编辑菜单";
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.onTypeChange(this.model.data.type);
        this.load();
      } else {
        this.title = "新建菜单";
        this.form.setFieldsValue({ type: 1 });
        this.onTypeChange(1);
        this.load();
      }
    });
  },
  methods: {
    loadMenuMaxSort(parentId) {
      if (!parentId || parentId == 0) {
        this.form.setFieldsValue({ sort: 1 });
        return;
      }
      request(GET_MENU_NEXT_SORT_VALUE, METHOD.GET, { parentId: parentId }).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.form.setFieldsValue({ sort: result.data.data });
      });
    },
    load() {
      this.loading = true;

      request(GET_MENU_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.menuOptions.splice(0);
        this.menuOptions = resultData.data;
        this.menuListData.splice(0);
        this.generateMenuList(this.menuOptions);
        this.setCascader("parentId", this.menuListData, this.menuIdSelect);

        request(GET_VIEW_CASCADER, METHOD.GET).then((viewResult) => {
          let resultData = viewResult.data;
          if (resultData.code != 0) {
            return;
          }
          this.viewOptions.splice(0);
          this.viewOptions = resultData.data;
          this.viewListData.splice(0);
          this.generateViewList(this.viewOptions);
          this.setCascader("viewId", this.viewListData, this.viewIdSelect);

          request(GET_API_CASCADER, METHOD.GET).then((apiResult) => {
            let resultData = apiResult.data;
            if (resultData.code != 0) {
              return;
            }
            this.apiOptions.splice(0);
            this.apiOptions = resultData.data;
            this.apiListData.splice(0);
            this.generateApiList(this.apiOptions);
            this.setCascader("apiId", this.apiListData, this.apiIdSelect);

            request(GET_MENU_TYPES, METHOD.GET).then((orgResult) => {
              if (orgResult.data.code != 0) {
                return;
              }
              this.typeSelectList.splice(0);
              orgResult.data.data.forEach((r) => {
                this.typeSelectList.push(r);
              });
              this.loading = false;
            });
          });
        });
      });
    },
    generateMenuList(data) {
      for (let i = 0; i < data.length; i++) {
        this.menuListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateMenuList(data[i].children);
        }
      }
    },
    generateViewList(data) {
      for (let i = 0; i < data.length; i++) {
        this.viewListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateViewList(data[i].children);
        }
      }
    },
    generateApiList(data) {
      for (let i = 0; i < data.length; i++) {
        this.apiListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateApiList(data[i].children);
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
    onMenuIdChange(value) {
      if (value.length > 4) {
        this.$message.warn("菜单深度不能超过5层");
        return;
      }
      this.menuIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ parentId: 0 });
        return;
      }
      let parentId = value[value.length - 1];
      this.form.setFieldsValue({ parentId: parentId });
      //新增，自动获取排序
      if (this.model.type === "create") {
        this.loadMenuMaxSort(parentId);
      }
    },
    onViewIdChange(value) {
      this.viewIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ viewId: 0 });
        return;
      }
      let viewId = value[value.length - 1];
      this.form.setFieldsValue({ viewId: viewId });
      //set form name
      let viewInfo = this.searchItemOnList(this.viewListData, viewId);
      if (viewInfo && viewInfo.name) {
        this.form.setFieldsValue({ name: viewInfo.name });
      }
    },
    onApiIdChange(value) {
      this.apiIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ apiId: 0 });
        return;
      }
      let apiId = value[value.length - 1];
      this.form.setFieldsValue({ apiId: apiId });
      //set form name
      let apiInfo = this.searchItemOnList(this.apiListData, apiId);
      if (apiInfo && apiInfo.name) {
        this.form.setFieldsValue({ name: apiInfo.name });
      }
    },
    onTypeChange(value) {
      if (value == 1 || value == 3) {
        //视图或分组
        this.viewOrGroupSelected = true;
        this.apiSelected = false;
      } else if (value == 2) {
        //接口
        this.viewOrGroupSelected = false;
        this.apiSelected = true;
      } else {
        this.viewOrGroupSelected = false;
        this.apiSelected = false;
      }
    },
    searchItemOnList(source, value) {
      if (!source || !value) {
        return null;
      }
      for (let i = 0; i < source.length; i++) {
        if (source[i].id && source[i].id == value) {
          return source[i];
        }
      }
    },
  },
};
</script>
