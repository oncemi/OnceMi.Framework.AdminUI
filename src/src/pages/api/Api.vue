<template>
  <a-card>
    <div :class="advanced ? 'search' : null">
      <a-form layout="horizontal">
        <div :class="advanced ? null : 'fold'">
          <a-row>
            <a-col :md="8" :sm="24" style="margin-right: 8px">
              <a-form-item label="API版本" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                <a-select v-model="paramApiVersion" placeholder="请选择">
                  <a-select-option value="">请选择</a-select-option>
                  <a-select-option v-for="item in apiVersionsSelectList" :key="item.value" :value="item.value">
                    {{ item.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="关键字" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                <a-input v-model="paramKeyword" placeholder="请输入" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>
        <span class="search-left">
          <a-space>
            <a-button type="primary" icon="search" @click="load">查询</a-button>
            <a-button icon="close-circle" @click="reset">重置</a-button>
            <a @click="toggleAdvanced">
              {{ advanced ? "收起" : "展开" }}
              <a-icon :type="advanced ? 'up' : 'down'" />
            </a>
          </a-space>
        </span>
      </a-form>
    </div>
    <div>
      <a-space class="operator">
        <a-button @click="add" type="primary" icon="form">新建</a-button>
        <a-button @click="deleteSelectItems" type="danger" icon="delete">删除</a-button>
        <a-button @click="resolve" icon="sync">同步</a-button>
      </a-space>
      <div>
        <a-table
          :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
          :expanded-row-keys.sync="expandedRowKeys"
          :columns="columns"
          :data-source="data"
          :pagination="pagination"
          :sortDirections="['descend', 'ascend']"
          :loading="loading"
          :scroll="{ scrollToFirstRowOnChange: true, x: 1200, y: 500 }"
          rowKey="id"
          @change="onChange"
          @expand="onExpand"
        >
          <span slot="ellipsisCol" slot-scope="text">
            <a-tooltip placement="topLeft">
              <template slot="title">
                {{ text }}
              </template>
              {{ text }}
            </a-tooltip>
          </span>
          <span slot="status" slot-scope="status">
            <a-tag :color="status == true ? 'green' : 'volcano'">
              {{ status == true ? "启用" : "禁用" }}
            </a-tag>
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
  </a-card>
</template>

<script>
import {
  GET_API_LIST,
  DELETE_API_ITEM,
  POST_API_ITEM,
  PUT_API_ITEM,
  SYNC_API_ITEM,
  GET_APIVERSION_SELECTLIST,
} from "@/services/api";
import { request, METHOD } from "@/utils/request";
import CreateForm from "./modules/CreateForm";
export default {
  name: "ApiManagement",
  i18n: require("./i18n"),
  components: {
    CreateForm,
  },
  data() {
    return {
      //展开/关闭高级搜素
      advanced: false,
      data: [],
      columns: [
        {
          title: "名称",
          dataIndex: "name",
          width: 230,
        },
        {
          title: "路径",
          dataIndex: "path",
        },
        {
          title: "版本",
          dataIndex: "version",
          width: 80,
        },
        {
          title: "请求方式",
          dataIndex: "method",
          width: 100,
        },
        {
          title: "权限",
          dataIndex: "code",
          ellipsis: true,
          scopedSlots: { customRender: "ellipsisCol" },
        },
        {
          title: "状态",
          dataIndex: "isEnabled",
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
      expandedRowKeys: [],
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
        showTotal: (total) => `共有 ${total} 条数据（不含子节点）`,
        onShowSizeChange: (_, pageSize) => {
          this.pageSize = pageSize;
        },
        onChange: (page) => {
          this.page = page;
        },
      },
      apiVersionsSelectList: [],
      paramApiVersion: "",
      paramKeyword: "",
      //添加/修改弹窗
      visible: false,
      mdl: null,
    };
  },
  watch: {
    pageSize() {
      this.load();
    },
    page() {
      this.load();
    },
  },
  authorize: {
    deleteRecord: "delete",
  },
  created() {
    this.loadApiVersion();
    this.load();
  },
  methods: {
    loadApiVersion() {
      request(GET_APIVERSION_SELECTLIST, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.apiVersionsSelectList.splice(0);
        result.data.data.forEach((r) => {
          this.apiVersionsSelectList.push(r);
        });
      });
    },
    load() {
      this.loading = true;
      request(GET_API_LIST, METHOD.GET, {
        page: this.page,
        size: this.pageSize,
        search: this.paramKeyword ?? this.paramKeyword,
        apiVersion: this.paramApiVersion ?? this.paramApiVersion,
        orderby:
          typeof this.orderFiled != "undefined" && this.orderFiled.length > 0 ? `${this.orderFiled},${this.sort}` : "",
      })
        .then((result) => {
          if (result.data.code != 0) {
            return;
          }

          this.data.splice(0);
          this.selectedRowKeys.splice(0);
          this.expandedRowKeys.splice(0);

          this.formatData(result.data.data.pageData);
          this.data = result.data.data.pageData;
          this.pagination.total = result.data.data.count;
          this.loading = false;
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    },
    reset() {
      this.paramApiVersion = "";
      this.paramKeyword = "";
      this.load();
    },
    resolve() {
      let self = this;
      this.$confirm({
        title: "同步系统API?",
        content: "将自动发现系统中的API并同步到数据库中。",
        onOk() {
          return request(SYNC_API_ITEM, METHOD.POST)
            .then((result) => {
              if (result.data.code != 0) {
                return;
              }
              self.$message.success("接口同步成功");
              self.load();
            })
            .catch((err) => {
              if (err) console.error(err);
            });
        },
        onCancel() {},
      });
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
        this.mdl = { type: "update", data: record };
      });
    },
    save() {
      const form = this.$refs.createModal.form;
      this.$refs.createModal.loading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          if (values.parentId && (!values.method || values.method.length <= 0)) {
            this.$message.warning("当Api不为根节点（控制器）时，请求方式不能为空");
            this.$refs.createModal.loading = false;
            return;
          }
          if (values.id > 0) {
            // 修改 e.g.
            request(PUT_API_ITEM, METHOD.PUT, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createModal.loading = false;
                  return;
                }
                this.load();
                this.visible = false;
                this.$refs.createModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("接口修改成功");
              })
              .catch(() => {
                this.$refs.createModal.loading = false;
              });
          } else {
            request(POST_API_ITEM, METHOD.POST, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createModal.loading = false;
                  return;
                }
                this.load();
                this.visible = false;
                this.$refs.createModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("接口创建成功");
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
      this.$confirm({
        title: message,
        content: "注意：将删除节点与节点下面的所有子节点！",
        okType: "danger",
        onOk() {
          return request(DELETE_API_ITEM, METHOD.DELETE, delArgs)
            .then((result) => {
              if (result.data.code != 0) {
                return;
              }
              self.load();
              self.$message.success("删除成功");
            })
            .catch((err) => {
              if (err) console.error(err);
            });
        },
        onCancel() {},
      });
    },
    onSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    toggleAdvanced() {
      this.advanced = !this.advanced;
    },
    onChange(pagination, filters, sorter) {
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
        this.load();
      }
    },
    onExpand(expanded, record) {
      let index = this.expandedRowKeys.indexOf(record.id);
      if (expanded == true) {
        if (index == -1) {
          this.expandedRowKeys.push(record.id);
        }
      } else {
        if (index > -1) {
          this.expandedRowKeys.splice(index, 1);
        }
      }
    },
    formatData(data) {
      if (typeof data == "undefined" || data.length == 0) {
        return;
      }
      for (let i = 0; i < data.length; i++) {
        if (data[i].children.length > 0) {
          this.expandedRowKeys.push(data[i].id);
          this.formatData(data[i].children);
        } else {
          data[i].children = null;
        }
      }
    },
  },
};
</script>

<style scoped lang="less">
@import "index.less";
</style>
