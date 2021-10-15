<template>
  <a-card>
    <div :class="advanced ? 'search' : null">
      <a-form layout="horizontal">
        <div :class="advanced ? null : 'fold'">
          <a-row>
            <a-col :md="8" :sm="24" v-if="false">
              <a-form-item label="状态" :labelCol="{ span: 5 }" :wrapperCol="{ span: 18, offset: 1 }">
                <a-select v-model="paramStatus" placeholder="请选择">
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
          :scroll="{ scrollToFirstRowOnChange: true, x: 1200, y: 500 }"
          rowKey="id"
          @change="onChange"
        >
          <span slot="isAllowComment" slot-scope="isAllowComment">
            <a-tag :color="isAllowComment == true ? 'green' : 'volcano'">
              {{ isAllowComment == true ? "允许" : "禁止" }}
            </a-tag>
          </span>
          <span slot="isDraw" slot-scope="isDraw">
            <a-tag :color="isDraw == false ? 'green' : 'volcano'">
              {{ isDraw == false ? "已发布" : "草稿" }}
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
  </a-card>
</template>

<script>
import { GET_ARTICLE_LIST, DELETE_ARTICLE_ITEM, POST_VIEW_ITEM, PUT_VIEW_ITEM } from "@/services/api";
import { request, METHOD } from "@/utils/request";
export default {
  name: "ViewManagement",
  i18n: require("./i18n"),
  data() {
    return {
      //展开/关闭高级搜素
      advanced: false,
      data: [],
      columns: [
        {
          title: "标题",
          dataIndex: "title",
        },
        {
          title: "分类",
          dataIndex: "categories",
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
          dataIndex: "isDraw",
          scopedSlots: { customRender: "isDraw" },
        },
        {
          title: "是否允许评论",
          dataIndex: "isAllowComment",
          scopedSlots: { customRender: "isAllowComment" },
        },
        {
          title: "标签",
          dataIndex: "tags",
          customRender: (value, row, index) => {
            if (!value || value.length == 0) {
              return "";
            }
            let result = "";
            for (let i = 0; i < value.length; i++) {
              if (i == 0) {
                result += value[i].tag;
              } else {
                result += "，" + value[i].tag;
              }
            }
            return result;
          },
        },
        {
          title: "作者",
          dataIndex: "author",
        },
        {
          title: "查看次数",
          dataIndex: "viewNum",
        },
        {
          title: "评论数",
          dataIndex: "commentNum",
        },
        {
          title: "创建时间",
          dataIndex: "createdTime",
          sorter: true,
        },
        {
          title: "编辑时间",
          dataIndex: "updatedTime",
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
  methods: {
    load() {
      this.loading = true;
      request(GET_ARTICLE_LIST, METHOD.GET, {
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
        .catch(() => {
          this.loading = false;
        });
    },
    reset() {
      this.paramStatus = "";
      this.paramKeyword = "";
      this.load();
    },
    add() {
      //
      this.$openPage("articleEdit");
    },
    edit(record) {
      this.$openPage({
        name: "编写文章",
        component: () => import("@/pages/article/ArticleEdit"),
        query: {
          articleId: record.id,
        },
      });
    },
    deleteSelectItems() {
      if (this.selectedRowKeys.length == 0) {
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
        message = `确认删除“${records.title}”吗？`;
        delArgs.push(records.id);
      }
      self.$confirm({
        title: message,
        onOk() {
          return new Promise((resolve, reject) => {
            return request(DELETE_ARTICLE_ITEM, METHOD.DELETE, delArgs).then((result) => {
              let resultData = result.data;
              if (resultData.code != 0) {
                reject();
                return;
              }
              resolve();
              self.load();
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
