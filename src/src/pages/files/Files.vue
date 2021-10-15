<template>
  <a-card>
    <div :class="advanced ? 'search' : null">
      <a-form layout="horizontal">
        <div :class="advanced ? null : 'fold'">
          <a-row>
            <a-col :md="8" :sm="24" v-if="false">
              <a-form-item label="类型" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                <a-select v-model="paramTypes" placeholder="请选择">
                  <a-select-option value="">请选择</a-select-option>
                  <a-select-option value="1">启用</a-select-option>
                  <a-select-option value="2">禁用</a-select-option>
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
        <a-button @click="add" type="primary" icon="upload">上传</a-button>
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
          :scroll="{ scrollToFirstRowOnChange: true, x: 1200, y: 500 }"
          rowKey="id"
          @change="onChange"
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
              <a-button type="primary" size="small" @click="download(record)" :style="{ 'margin-right': '6px' }"
                >下载</a-button
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
import { GET_FILE_LIST, DELETE_FILE_ITEM } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import { mapState } from "vuex";
import CreateForm from "./modules/CreateForm";
import axios from "axios";

export default {
  name: "FilesManagement",
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
          dataIndex: "oldName",
          ellipsis: true,
          scopedSlots: { customRender: "ellipsisCol" },
        },
        {
          title: "储存名称",
          dataIndex: "name",
          ellipsis: true,
          scopedSlots: { customRender: "ellipsisCol" },
        },
        {
          title: "文件路径",
          dataIndex: "path",
          ellipsis: true,
          scopedSlots: { customRender: "ellipsisCol" },
        },
        {
          title: "大小(KB)",
          dataIndex: "size",
        },
        {
          title: "储存类型",
          dataIndex: "storageTypeName",
        },
        {
          title: "储存桶",
          dataIndex: "bucketName",
        },
        {
          title: "访问权限",
          dataIndex: "accessModeName",
        },
        {
          title: "上传时间",
          dataIndex: "createdTime",
          sorter: true,
        },
        {
          title: "所有人",
          dataIndex: "ownerName",
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
        showTotal: (total) => `共有 ${total} 条数据（不含子节点）`,
        onShowSizeChange: (_, pageSize) => {
          this.pageSize = pageSize;
        },
        onChange: (page) => {
          this.page = page;
        },
      },
      paramTypes: "",
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
    this.load();
  },
  computed: {
    ...mapState("account", ["user", "token"]),
  },
  methods: {
    load() {
      this.loading = true;
      request(GET_FILE_LIST, METHOD.GET, {
        page: this.page,
        size: this.pageSize,
        search: this.paramKeyword ?? this.paramKeyword,
        orderby:
          typeof this.orderFiled != "undefined" && this.orderFiled.length > 0 ? `${this.orderFiled},${this.sort}` : "",
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
        .catch((err) => {
          console.error(err);
          this.loading = false;
        });
    },
    reset() {
      this.paramTypes = "";
      this.paramKeyword = "";
      this.load();
    },
    async add() {
      this.visible = true;
      this.$nextTick(() => {
        this.mdl = {
          type: "update",
          data: {
            userId: this.user.id,
            accessMode: "PublicRead",
          },
        };
      });
    },
    download(record) {
      //下载
      if (!record || !record.url || record.url.length == 0) {
        this.$message.warning("下载失败，无法获取文件URL");
        return;
      }

      let token = this.token.access_token;
      if (!token) {
        this.$message.warning("获取当前登录用户信息失败");
        return;
      }
      let url = record.url + "&token=" + encodeURIComponent(token);
      window.open(url, "_blank", "");
    },
    save() {
      const form = this.$refs.createModal.form;
      this.$refs.createModal.loading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          this.load();
          return;
        } else {
          this.$refs.createModal.loading = false;
        }
      });
    },
    cancel() {
      this.visible = false;
      const form = this.$refs.createModal.form;
      form.resetFields(); // 清理表单数据（可不做）
      this.load();
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
        message = `确认删除文件“${records.oldName}”吗？`;
        delArgs.push(records.id);
      }
      self.$confirm({
        title: message,
        content: "注意：文件删除后无法恢复！",
        onOk() {
          return new Promise((resolve, reject) => {
            return request(DELETE_FILE_ITEM, METHOD.DELETE, delArgs).then((result) => {
              let resultData = result.data;
              if (resultData.code != 0) {
                reject();
                return;
              }
              self.load();
              resolve();
              self.$message.success("删除成功");
            });
          }).catch((err) => {
            this.$message.error(err.message);
            console.error(err);
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
  },
};
</script>

<style scoped lang="less">
@import "index";
</style>
