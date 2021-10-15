<template>
  <a-row style="margin: 0 -12px">
    <a-col style="padding: 0 12px" :xl="6" :lg="6" :md="6" :sm="6" :xs="6">
      <a-card
        :title="$t('organizeTreeTitle')"
        :loading="loadingOrganizes"
        style="margin-bottom: 24px;"
        :bordered="false"
        :body-style="{ padding: 0 }"
      >
        <div>
          <template>
            <div>
              <a-input-search style="margin-bottom: 8px" placeholder="Search" @change="onOrganizeSearchChange" />
              <a-tree
                :multiple="false"
                show-icon
                :defaultExpandAll="true"
                :expandedKeys="organizeExpandedKeys"
                :autoExpandParent="autoExpandOrganizeParent"
                :selected-keys="selectedOrganizeKeys"
                :treeData="organizeData"
                :replaceFields="{
                  children: 'children',
                  title: 'label',
                  key: 'id',
                }"
                @expand="onOrganizeTreeExpand"
                @select="onOrganizeTreeSelect"
                :icon="getIcon"
              >
                <template slot="label" slot-scope="{ label }">
                  <span v-if="label.indexOf(searchOrganizeValue) > -1">
                    {{ label.substr(0, label.indexOf(searchOrganizeValue)) }}
                    <span style="color: #f50">{{ searchOrganizeValue }}</span>
                    {{ label.substr(label.indexOf(searchOrganizeValue) + searchOrganizeValue.length) }}
                  </span>
                  <span v-else>{{ label }}</span>
                </template>
              </a-tree>
            </div>
          </template>
        </div>
      </a-card>
    </a-col>
    <a-col style="padding: 0 12px" :xl="18" :lg="18" :md="18" :sm="18" :xs="18">
      <a-card :title="$t('userListTitle')" style="margin-bottom: 24px" :bordered="false" :body-style="{ padding: 0 }">
        <div slot="extra">
          <a-button @click="reload" type="link">{{ $t("refeshUserList") }}</a-button>
        </div>
        <template>
          <a-form layout="horizontal">
            <a-row>
              <a-col :md="6" :sm="12">
                <a-form-item label="状态" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                  <a-select v-model="paramStatus" placeholder="请选择">
                    <a-select-option value="">请选择</a-select-option>
                    <a-select-option value="Enable">启用</a-select-option>
                    <a-select-option value="Disable">禁用</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="12" style="margin-right: 8px">
                <a-form-item label="角色Id" v-if="false">
                  <a-input v-model="paramRoleId" placeholder="请输入" />
                </a-form-item>
                <a-form-item label="角色" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                  <a-cascader
                    :value="roleIdSelect"
                    ref="cascader"
                    :options="roleOptions"
                    change-on-select
                    @change="onRoleSelectChange"
                    :field-names="{ label: 'name', value: 'id', children: 'children' }"
                    placeholder="请选择"
                  />
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="12" style="margin-right: 8px">
                <a-form-item label="关键字" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                  <a-input v-model="paramKeyword" placeholder="请输入" />
                </a-form-item>
              </a-col>
              <a-col class="searchBtn">
                <a-button type="primary" icon="search" @click="loadUser">查询</a-button>
                <a-button icon="close-circle" style="margin-left: 8px" @click="reset">重置</a-button>
              </a-col>
            </a-row>
          </a-form>
          <div>
            <a-space class="operator">
              <a-button @click="add" type="primary" icon="form">新建</a-button>
              <a-button @click="deleteSelectItems" type="danger" icon="delete">删除</a-button>
            </a-space>
            <div>
              <a-table
                :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
                :columns="columns"
                :data-source="data"
                :pagination="pagination"
                :sortDirections="['descend', 'ascend']"
                :loading="loading"
                :scroll="{ scrollToFirstRowOnChange: true, x: 900, y: 580 }"
                rowKey="id"
                @change="onUserTableChange"
              >
                <span slot="status" slot-scope="status">
                  <a-tag :color="status == 'Enable' ? 'green' : 'volcano'">
                    {{ status == "Enable" ? "启用" : "禁用" }}
                  </a-tag>
                </span>
                <span slot="phoneNumber" slot-scope="text, record">
                  <p :style="record.phoneNumberConfirmed === true ? '' : 'color: red;'">
                    {{ text }}
                  </p>
                </span>
                <span slot="email" slot-scope="text, record">
                  <p :style="record.emailConfirmed === true ? '' : 'color: red;'">
                    {{ text }}
                  </p>
                </span>
                <span slot="options" slot-scope="text, record">
                  <div>
                    <a-button type="primary" size="small" @click="edit(record)" :style="{ 'margin-right': '6px' }"
                      >编辑</a-button
                    >
                    <a-button type="danger" size="small" @click="deleteWithConfirm(record)">删除</a-button>
                  </div>
                </span>
              </a-table>
            </div>
          </div>
          <create-form ref="createModal" :visible="visible" :model="mdl" @cancel="cancel" @ok="save" />
        </template>
      </a-card>
    </a-col>
  </a-row>
</template>
<script>
import {
  GET_ROLE_CASCADER,
  GET_ORGANIZE_SELECT_TREE,
  GET_USER_LIST,
  PUT_USER_ITEM,
  POST_USER_ITEM,
  DELETE_USER_ITEM,
} from "@/services/api";
import { request, METHOD } from "@/utils/request";
import CreateForm from "./modules/CreateForm";
import sha256 from "js-sha256";

export default {
  name: "UserManagement",
  i18n: require("./i18n"),
  components: {
    CreateForm,
  },
  data() {
    return {
      loadingOrganizes: true,
      organizeExpandedKeys: [],
      searchOrganizeValue: "",
      autoExpandOrganizeParent: true,
      selectedOrganizeKeys: [],
      organizeData: [],
      organizeDataList: [],
      permissionListData: [],
      selectOrganizeId: 0,
      //用户表格
      data: [],
      columns: [
        {
          title: "账号",
          dataIndex: "userName",
        },
        {
          title: "名称",
          dataIndex: "nickName",
        },
        {
          title: "电话",
          dataIndex: "phoneNumber",
          scopedSlots: { customRender: "phoneNumber" },
        },
        {
          title: "邮件",
          dataIndex: "email",
          scopedSlots: { customRender: "email" },
        },
        {
          title: "性别",
          dataIndex: "gender",
          customRender: (value, row, index) => {
            if (!value) {
              return "未知";
            }
            value = value.toLowerCase();
            if (value === "male") {
              return "男";
            } else if (value === "female") {
              return "女";
            } else {
              return "未知";
            }
          },
          width: 80,
        },
        {
          title: "角色",
          dataIndex: "roles",
          customRender: (value, row, index) => {
            if (!value || value.length == 0) {
              return "";
            }
            let result = "";
            for (let i = 0; i < value.length; i++) {
              if (i == 0) {
                result += value[i].name;
              } else {
                result += "，" + value[i].name;
              }
            }
            return result;
          },
        },
        {
          title: "所属机构",
          dataIndex: "organizes",
          customRender: (value, row, index) => {
            if (!value || value.length == 0) {
              return "";
            }
            let result = "";
            for (let i = 0; i < value.length; i++) {
              if (i == 0) {
                result += value[i].name;
              } else {
                result += "，" + value[i].name;
              }
            }
            return result;
          },
        },
        {
          title: "状态",
          dataIndex: "status",
          scopedSlots: { customRender: "status" },
          width: 80,
        },
        {
          title: "创建时间",
          dataIndex: "createdTime",
          sorter: true,
        },
        {
          title: "操作",
          dataIndex: "options",
          scopedSlots: { customRender: "options" },
          fixed: "right",
        },
      ],
      selectedRowKeys: [],
      loading: true,
      pageSize: 10,
      page: 1,
      orderFiled: "",
      sort: "",
      pagination: {
        total: 0,
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (total) => `共有 ${total} 条数据`,
        onShowSizeChange: (_, pageSize) => {
          this.pageSize = pageSize;
        },
        onChange: (page) => {
          this.page = page;
        },
      },
      paramStatus: "",
      paramKeyword: "",
      //添加/修改弹窗
      visible: false,
      mdl: null,
      //角色搜素
      paramRoleId: 0,
      roleIdSelect: [],
      roleOptions: [],
      roleListData: [],
    };
  },
  created() {
    this.loadRoleSelectData();
    this.reload();
  },
  watch: {
    pageSize() {
      this.loadUser();
    },
    page() {
      this.loadUser();
    },
    selectOrganizeId() {
      this.loadUser();
    },
  },
  methods: {
    reload() {
      let self = this;
      request(GET_ORGANIZE_SELECT_TREE, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        self.searchOrganizeValue = "";
        self.organizeExpandedKeys.splice(0);
        self.organizeData.splice(0);
        self.organizeDataList.splice(0);
        self.selectedOrganizeKeys.splice(0);
        self.selectOrganizeId = 0;
        self.organizeData = result.data.data;
        self.generateOrganizeList(self.organizeData);
        self.loadingOrganizes = false;

        //设置默认选中
        if (self.organizeDataList && self.organizeDataList.length > 0) {
          self.selectedOrganizeKeys.push(self.organizeDataList[0].key);
          self.selectOrganizeId = self.organizeDataList[0].key;
        }
        //设置了watch，不用手动调用
        //self.loadUser();
      });
    },
    loadRoleSelectData() {
      this.roleIdSelect = [];
      request(GET_ROLE_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.roleOptions.splice(0);
        this.roleOptions = resultData.data;
        this.roleListData.splice(0);
        this.generateRoleList(this.roleOptions);
      });
    },
    loadUser() {
      this.loading = true;
      request(GET_USER_LIST, METHOD.GET, {
        page: this.page,
        size: this.pageSize,
        search: this.paramKeyword,
        orderby:
          typeof this.orderFiled != "undefined" && this.orderFiled.length > 0 ? `${this.orderFiled},${this.sort}` : "",
        status: this.paramStatus,
        roleId: this.paramRoleId,
        organizeId: this.selectOrganizeId,
      })
        .then((result) => {
          let resultData = result.data;
          if (resultData.code != 0) {
            return;
          }

          this.data.splice(0);
          this.selectedRowKeys.splice(0);

          this.data = resultData.data.pageData;
          this.pagination.total = result.data.data.count;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onOrganizeTreeExpand(expandedKeys) {
      this.organizeExpandedKeys = expandedKeys;
      this.autoExpandOrganizeParent = false;
    },
    onOrganizeSearchChange(e) {
      const value = e.target.value;
      const expandedKeys = this.organizeDataList
        .map((item) => {
          if (item.label.indexOf(value) > -1) {
            return this.getParentKey(item.key, this.organizeData);
          }
          return null;
        })
        .filter((item, i, a) => item && a.indexOf(item) === i);
      Object.assign(this, {
        organizeExpandedKeys: expandedKeys,
        searchOrganizeValue: value,
        autoExpandOrganizeParent: true,
      });
    },
    onOrganizeTreeSelect(keys, event) {
      if (keys == null || keys.length == 0) {
        return;
      }
      this.selectedOrganizeKeys = keys;
      this.selectOrganizeId = keys[0];
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
    generateOrganizeList(data) {
      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const key = node.id;
        const label = node.label;
        this.organizeDataList.push({ key, label: label });
        if (node.children && node.children.length > 0) {
          this.organizeExpandedKeys.push(key);
          this.generateOrganizeList(node.children);
        }
      }
    },
    getIcon(props) {
      const { expanded, children } = props;
      if (children && children.length > 0) {
        return <a-icon type={expanded ? "folder-open" : "folder"} />;
      } else {
        return <a-icon type="user" />;
      }
    },
    reset() {
      this.paramStatus = "";
      this.paramKeyword = "";
      this.paramRoleId = 0;
      this.roleIdSelect = [];
      this.loadUser();
    },
    add() {
      this.visible = true;
      this.$nextTick(() => {
        this.mdl = { type: "create", data: null };
      });
    },
    edit(record) {
      this.visible = true;
      this.$nextTick(() => {
        this.mdl = { type: "update", hidePwd: false, data: record };
      });
    },
    save() {
      const form = this.$refs.createModal.form;
      this.$refs.createModal.loading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          //设置角色
          let sourceRoles = this.$refs.createModal.roleSelect;
          if (!sourceRoles || sourceRoles.length == 0) {
            this.$message.warning("用户角色不能为空");
            this.$refs.createModal.loading = false;
            return;
          }
          let userRoles = [];
          for (let i = 0; i < sourceRoles.length; i++) {
            userRoles.push(sourceRoles[i].value);
          }
          values.userRoles = userRoles;
          //设置组织机构
          let sourceOrganizes = this.$refs.createModal.organizeSelect;
          if (!sourceOrganizes || sourceOrganizes.length == 0) {
            this.$message.warning("用户组织不能为空");
            this.$refs.createModal.loading = false;
            return;
          }
          let userOrganizes = [];
          for (let i = 0; i < sourceOrganizes.length; i++) {
            userOrganizes.push(sourceOrganizes[i].value);
          }
          values.userOrganizes = userOrganizes;
          //密码加密
          if (values.password && values.password.length > 0) {
            values.password = sha256.sha256(values.password);
          }
          values.PasswordHashed = true;
          if (values.id > 0) {
            // 修改 e.g.
            request(PUT_USER_ITEM, METHOD.PUT, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createModal.loading = false;
                  return;
                }
                this.loadUser();
                this.visible = false;
                this.$refs.createModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("用户修改成功");
              })
              .catch(() => {
                this.$refs.createModal.loading = false;
              });
          } else {
            if (!values.password || values.password.length == 0) {
              this.$message.warning("创建用户时，密码不能为空");
              this.$refs.createModal.loading = false;
              return;
            }
            request(POST_USER_ITEM, METHOD.POST, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createModal.loading = false;
                  return;
                }
                this.loadUser();
                this.visible = false;
                this.$refs.createModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("用户创建成功");
              })
              .catch(() => {
                this.$refs.createModal.loading = false;
              });
          }
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
    deleteSelectItems() {
      //
      if (this.selectedRowKeys.length == 0) {
        //
        this.$message.warning("没有选中的数据");
        return;
      }
      this.deleteWithConfirm(this.selectedRowKeys);
    },
    deleteWithConfirm(records) {
      let delArgs = [];
      let message = "";
      let self = this;
      if (Array.isArray(records)) {
        message = "确认要删除所选条目吗？";
        records.forEach((item) => {
          delArgs.push(item);
        });
      } else {
        message = `确认删除“${records.name}”吗？`;
        delArgs.push(records.id);
      }
      self.$confirm({
        title: message,
        content: "注意：将删除节点与节点下面的所有子节点！",
        onOk() {
          return new Promise((resolve, reject) => {
            return request(DELETE_USER_ITEM, METHOD.DELETE, delArgs).then((result) => {
              let resultData = result.data;
              if (resultData.code != 0) {
                reject();
                return;
              }
              self.loadUser();
              resolve();
              self.$message.success("删除成功");
            });
          }).catch((err) => {
            this.$message.error(err.message);
          });
        },
        onCancel() {},
      });
    },
    onSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    onUserTableChange(pagination, filters, sorter) {
      let orderFiled = "";
      let sort = "";
      if (sorter.order) {
        if (sorter.column && sorter.column.orderFiled) {
          orderFiled = sorter.column.orderFiled;
        } else {
          orderFiled = sorter.field || "id";
        }
        sort = sorter.order === "ascend" ? "asc" : "desc";
      } else {
        orderFiled = "";
        sort = "";
      }
      if (this.orderFiled != orderFiled || this.sort != sort) {
        this.orderFiled = orderFiled;
        this.sort = sort;
        this.loadUser();
      }
    },
    onRoleSelectChange(value) {
      if (value.length >= 5) {
        this.$message.warning("角色树深度不能超过5层");
        return;
      }
      this.roleIdSelect = value;
      if (!value || value.length == 0) {
        this.paramRoleId = 0;
        return;
      }
      this.paramRoleId = value[value.length - 1];
    },
    generateRoleList(data) {
      for (let i = 0; i < data.length; i++) {
        this.roleListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateRoleList(data[i].children);
        }
      }
    },
  },
};
</script>

<style lang="less">
@import "index";

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
</style>
