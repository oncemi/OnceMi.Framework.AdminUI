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
        <span style="float: right;">
          <a-button type="primary" @click="load">查询</a-button>
          <a-button style="margin-left: 8px" @click="reset">重置</a-button>
          <a @click="toggleAdvanced" style="margin-left: 8px">
            {{ advanced ? "收起" : "展开" }}
            <a-icon :type="advanced ? 'up' : 'down'" />
          </a>
        </span>
      </a-form>
    </div>
    <div>
      <div>
        <a-table
          :columns="columns"
          :data-source="data"
          :pagination="pagination"
          :sortDirections="['descend', 'ascend']"
          :loading="loading"
          :scroll="{ scrollToFirstRowOnChange: true, x: 800, y: 580 }"
          rowKey="value"
          @change="onChange"
        >
          <span slot="options" slot-scope="text, record">
            <div>
              <a-button type="danger" size="small" @click="cleanWithConfirm(record)">清理</a-button>
            </div>
          </span>
        </a-table>
      </div>
    </div>
  </a-card>
</template>

<script>
import { GET_CACHE_LIST, DELETE_CACHE_LIST } from "@/services/api";
import { request, METHOD } from "@/utils/request";

export default {
  name: "CacheManagement",
  i18n: require("./i18n"),
  data() {
    return {
      //展开/关闭高级搜素
      advanced: false,
      data: [],
      columns: [
        {
          title: "名称",
          dataIndex: "name",
        },
        {
          title: "缓存KEY",
          dataIndex: "value",
        },
        {
          title: "描述",
          dataIndex: "description",
          ellipsis: true,
        },
        {
          title: "操作",
          dataIndex: "options",
          scopedSlots: { customRender: "options" },
          fixed: "right",
        },
      ],
      loading: true,
      pageSize: 10,
      page: 1,
      orderFiled: "",
      sort: "",
      pagination: {
        total: 0,
        pageSize: 100,
        showSizeChanger: true,
        pageSizeOptions: ["100"],
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
      request(GET_CACHE_LIST, METHOD.GET, {
        queryString: this.paramKeyword ?? this.paramKeyword,
      })
        .then((result) => {
          let resultData = result.data;
          if (resultData.code != 0) {
            return;
          }
          this.data.splice(0);
          this.data = resultData.data;
          this.pagination.total = resultData.data.length;
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
    cleanWithConfirm(records) {
      let self = this;
      self.$confirm({
        title: "此操作将清除" + records.value + "下的所有缓存，确认吗？",
        content: "“{xxx}”表示通配符",
        onOk() {
          return request(DELETE_CACHE_LIST, METHOD.DELETE, {
            Value: records.value,
          }).then((result) => {
            if (result.data.code != 0) {
              return;
            }
            self.$message.success("清理完成，共清理了" + result.data.data.count + "条缓存");
          });
        },
        onCancel() {},
      });
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
