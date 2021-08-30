<template>
  <a-row style="margin: 0 -12px">
    <a-col style="padding: 0 12px" :xl="8" :lg="8" :md="12" :sm="12" :xs="12">
      <a-card
        :title="$t('dictionaryTreeTitle')"
        :loading="loadingDictionarys"
        style="margin-bottom: 24px;"
        :bordered="false"
        :body-style="{ padding: 0 }"
        :scroll="{ y: 500 }"
      >
        <div>
          <template>
            <a-row style="margin: 8px 0px 2px 0px;">
              <a-space class="operator">
                <a-button @click="add" type="primary" icon="form" size="small">新建</a-button>
                <a-button @click="deleteDictionary" type="danger" icon="delete" size="small">删除</a-button>
              </a-space>
            </a-row>
            <div>
              <a-input-search
                style="margin-bottom: 3px;margin-left: 10px;width: 95%"
                placeholder="Search"
                @change="onDictionarySearchChange"
              />
              <div class="main-tree">
                <a-tree
                  :multiple="false"
                  show-icon
                  :defaultExpandAll="true"
                  :expandedKeys="dictionaryExpandedKeys"
                  :autoExpandParent="autoExpandDictionaryParent"
                  :selected-keys="selectedDictionaryKeys"
                  :treeData="dictionaryData"
                  :replaceFields="{
                    children: 'children',
                    title: 'label',
                    key: 'id',
                  }"
                  @expand="onDictionaryTreeExpand"
                  @select="onDictionaryTreeSelect"
                  :icon="getIcon"
                >
                  <template slot="label" slot-scope="{ label }">
                    <span v-if="label.indexOf(searchDictionaryValue) > -1">
                      {{ label.substr(0, label.indexOf(searchDictionaryValue)) }}
                      <span style="color: #f50">{{ searchDictionaryValue }}</span>
                      {{ label.substr(label.indexOf(searchDictionaryValue) + searchDictionaryValue.length) }}
                    </span>
                    <span v-else>{{ label }}</span>
                  </template>
                </a-tree>
              </div>
            </div>
          </template>
        </div>
      </a-card>
    </a-col>
    <a-col style="padding: 0 12px" :xl="16" :lg="16" :md="12" :sm="12" :xs="12">
      <a-card
        :title="$t('dictionaryListTitle')"
        style="margin-bottom: 24px;"
        :loading="loadingDictionarys"
        :bordered="false"
        :body-style="{ padding: 0, height: '565px' }"
      >
        <div slot="extra">
          <a-button @click="reload" type="link">{{ $t("refeshDictionaryList") }}</a-button>
        </div>
        <template>
          <a-spin :spinning="loading">
            <a-form :form="form" v-bind="formItemLayout" @submit="saveDicDetail" style="padding: 24px 10px">
              <a-form-item v-show="false" label="主键ID">
                <a-input v-decorator="['id', { rules: [{ required: false }] }]" disabled />
              </a-form-item>
              <a-form-item v-show="false" label="父节点ID">
                <a-input v-decorator="['parentId', { rules: [{ required: false }] }]" disabled />
              </a-form-item>
              <a-form-item label="字典名称">
                <a-input v-decorator="['name', { rules: [{ required: true }] }]" placeholder="字典名称" />
              </a-form-item>
              <a-form-item label="字典编码">
                <a-input v-decorator="['code', { rules: [{ required: false }] }]" placeholder="可选，字典编码" />
              </a-form-item>
              <a-form-item label="字典值">
                <a-input v-decorator="['value', { rules: [{ required: false }] }]" placeholder="可选，字典值" />
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
                <a-textarea
                  v-decorator="['description', { rules: [{ required: false }] }]"
                  placeholder="可选，字典描述或备注"
                  :auto-size="{ minRows: 3, maxRows: 6 }"
                />
              </a-form-item>
              <a-form-item label="状态">
                <a-switch v-decorator="['isEnabled', { valuePropName: 'checked', initialValue: true }]" />
              </a-form-item>
              <a-form-item :wrapper-col="{ span: 12, offset: 6 }">
                <a-button type="primary" html-type="submit">
                  保存
                </a-button>
              </a-form-item>
            </a-form>
          </a-spin>
          <create-form ref="createModal" :visible="visible" :model="mdl" @cancel="cancel" @ok="save" />
        </template>
      </a-card>
    </a-col>
  </a-row>
</template>
<script>
import {
  GET_DICTIONARY_TREE,
  GET_DICTIONARY_ITEM,
  DELETE_DICTIONARY_ITEM,
  POST_DICTIONARY_ITEM,
  PUT_DICTIONARY_ITEM,
} from "@/services/api";
import pick from "lodash.pick";
import { request, METHOD } from "@/utils/request";
import CreateForm from "./modules/CreateForm";
export default {
  name: "DictionaryManagement",
  i18n: require("./i18n"),
  components: {
    CreateForm,
  },
  data() {
    return {
      fields: ["id", "parentId", "name", "code", "value", "sort", "description", "isEnabled"],
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 16 },
      },
      loading: false,
      loadingDictionarys: true,
      dictionaryExpandedKeys: [],
      searchDictionaryValue: "",
      autoExpandDictionaryParent: true,
      selectedDictionaryKeys: [],
      dictionaryData: [],
      dictionaryDataList: [],
      selectDictionaryId: 0,
      oldSelectDictionaryId: 0,

      //添加/修改弹窗
      visible: false,
      mdl: null,
    };
  },
  created() {
    this.reload();
    this.form = this.$form.createForm(this);
  },
  watch: {
    selectDictionaryId(value) {
      this.loadDicDetail(value);
    },
  },
  methods: {
    reload() {
      request(GET_DICTIONARY_TREE, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.searchDictionaryValue = "";
        this.dictionaryExpandedKeys.splice(0);
        this.dictionaryData.splice(0);
        this.dictionaryDataList.splice(0);
        this.selectedDictionaryKeys.splice(0);
        this.selectDictionaryId = 0;
        this.dictionaryData = result.data.data;
        this.generateDictionaryList(this.dictionaryData);
        this.loadingDictionarys = false;

        //设置默认选中
        if (this.dictionaryDataList && this.dictionaryDataList.length > 0) {
          if (this.oldSelectDictionaryId && this.oldSelectDictionaryId > 0) {
            this.selectedDictionaryKeys.push(this.oldSelectDictionaryId);
            this.selectDictionaryId = this.oldSelectDictionaryId;
            this.oldSelectDictionaryId = 0;
          } else {
            this.selectedDictionaryKeys.push(this.dictionaryDataList[0].key);
            this.selectDictionaryId = this.dictionaryDataList[0].key;
          }
        } else {
          this.loading = true;
        }
        //设置了watch，不用手动调用
      });
    },
    loadDicDetail(dicId) {
      // 重置表单数据
      this.form.resetFields();
      this.loading = true;
      this.fields.forEach((v) => this.form.getFieldDecorator(v));
      request(GET_DICTIONARY_ITEM, METHOD.GET, {
        Id: dicId,
        IncludeChild: false,
      }).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.form.setFieldsValue(pick(result.data.data, this.fields));
        this.loading = false;
      });
    },
    saveDicDetail(e) {
      e.preventDefault();
      this.loading = true;
      this.form.validateFields((errors, values) => {
        if (!errors) {
          //查找为未修改的
          let oldValue = this.searchDicById(this.dictionaryData, values.id);
          if (!oldValue) {
            this.$message.warning("获取字典详情失败!");
            this.loading = false;
            return;
          }
          request(PUT_DICTIONARY_ITEM, METHOD.PUT, values)
            .then((result) => {
              this.loading = false;
              if (result.data.code != 0) {
                return;
              }
              if (oldValue.sord != values.sort || oldValue.name != values.name) {
                this.oldSelectDictionaryId = values.id;
                this.reload();
              }
              this.$message.success("数据字典修改成功");
            })
            .catch(() => {
              this.loading = false;
            });
        } else {
          this.loading = false;
        }
      });
    },
    onDictionaryTreeExpand(expandedKeys) {
      this.dictionaryExpandedKeys = expandedKeys;
      this.autoExpandDictionaryParent = false;
    },
    onDictionarySearchChange(e) {
      const value = e.target.value;
      const expandedKeys = this.dictionaryDataList
        .map((item) => {
          if (item.label.indexOf(value) > -1) {
            return this.getParentKey(item.key, this.dictionaryData);
          }
          return null;
        })
        .filter((item, i, a) => item && a.indexOf(item) === i);
      Object.assign(this, {
        dictionaryExpandedKeys: expandedKeys,
        searchDictionaryValue: value,
        autoExpandDictionaryParent: true,
      });
    },
    onDictionaryTreeSelect(keys, event) {
      if (keys == null || keys.length == 0) {
        return;
      }
      this.selectedDictionaryKeys = keys;
      this.selectDictionaryId = keys[0];
    },
    getParentKey(id, tree) {
      let parentKey = null;
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
          if (node.children.some((item) => item.id === id)) {
            parentKey = node.id;
          } else if (this.getParentKey(id, node.children)) {
            parentKey = this.getParentKey(id, node.children);
          }
        }
      }
      return parentKey;
    },
    generateDictionaryList(data) {
      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const key = node.id;
        const label = node.label;
        this.dictionaryDataList.push({ key, label: label });
        if (node.children && node.children.length > 0) {
          this.dictionaryExpandedKeys.push(key);
          this.generateDictionaryList(node.children);
        }
      }
    },
    getIcon(props) {
      const { expanded, children } = props;
      if (children && children.length > 0) {
        return <a-icon type={expanded ? "folder-open" : "folder"} />;
      } else {
        return <a-icon type="book" />;
      }
    },
    add() {
      this.visible = true;
      this.$nextTick(() => {
        if (this.selectDictionaryId && this.selectDictionaryId > 0) {
          this.mdl = { type: "update", data: { parentId: this.selectDictionaryId } };
        } else {
          this.mdl = { type: "create", data: null };
        }
      });
    },
    edit(record) {
      this.visible = true;
      this.$nextTick(() => {
        this.mdl = { type: "update", data: record };
      });
    },
    save() {
      const form = this.$refs.createModal.form;
      this.$refs.createModal.loading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          request(POST_DICTIONARY_ITEM, METHOD.POST, values)
            .then((result) => {
              if (result.data.code != 0) {
                this.$refs.createModal.loading = false;
                return;
              }
              this.visible = false;
              this.$refs.createModal.loading = false;
              // 重置表单数据
              form.resetFields();
              this.$message.success("数据字典创建成功");
              this.oldSelectDictionaryId = this.selectDictionaryId;
              this.reload();
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
    deleteDictionary() {
      var self = this;
      if (!self.selectDictionaryId || self.selectDictionaryId == 0) {
        self.$message.warning("请先选中要删除的数据字典或数据字典节点");
        return;
      }
      let name = "";
      for (let i = 0; i < self.dictionaryDataList.length; i++) {
        if (self.dictionaryDataList[i].key == self.selectDictionaryId) {
          name = self.dictionaryDataList[i].label;
          break;
        }
      }
      let delArgs = [self.selectDictionaryId];
      self.$confirm({
        title: `确认删除数据字典【${name}】吗？`,
        content: "警告！如果包含子节点，子节点中的字典将一并删除。",
        onOk() {
          return new Promise((resolve, reject) => {
            request(DELETE_DICTIONARY_ITEM, METHOD.DELETE, delArgs).then((result) => {
              let resultData = result.data;
              if (resultData.code != 0) {
                reject();
                return;
              }
              self.reload();
              resolve();
              self.$message.success(`数据字典【${name}】及其子节点字典已删除`);
            });
          }).catch((err) => {
            this.$message.error(err.message);
          });
        },
        onCancel() {},
      });
    },
    searchDicById(data, id) {
      if (!data) {
        return null;
      }
      for (let i = 0; i < data.length; i++) {
        if (data[i].id == id) {
          return data[i];
        } else {
          if (data[i].children && data[i].children.length > 0) {
            let result = this.searchDicById(data[i].children, id);
            if (result) {
              return result;
            }
          }
          continue;
        }
      }
    },
  },
};
</script>

<style scoped lang="less">
@import "index.less";

.searchBtn {
  float: right;
  text-align: right;
  margin-top: 5px;
  margin-right: 10px;
}

.operator {
  margin-left: 10px;
  margin-bottom: 5px;
}

.main-tree {
  max-height: 500px;
  overflow-y: auto;
}
</style>
