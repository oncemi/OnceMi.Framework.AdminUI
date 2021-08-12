<template>
  <a-modal
    :title="title"
    :width="900"
    :visible="visible"
    :maskClosable="false"
    :footer="null"
    :destroyOnClose="true"
    @cancel="
      () => {
        $emit('cancel');
      }
    "
  >
    <a-row style="margin-top: 10px;margin-bottom: 10px">
      <a-col :span="12">
        <a-space class="operator" style="margin-left: 20px">
          <a-button @click="add" type="primary" icon="form" size="small">新建</a-button>
          <a-button @click="deleteSelectItems" type="danger" icon="delete" size="small">删除</a-button>
        </a-space>
      </a-col>
    </a-row>
    <a-spin :spinning="loading">
      <a-table
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        :columns="columns"
        :data-source="data"
        :pagination="pagination"
        :sortDirections="['descend', 'ascend']"
        :loading="loading"
        :scroll="{ scrollToFirstRowOnChange: true, x: 840, y: 650 }"
        size="small"
        rowKey="id"
        @change="onTableChange"
      >
        <span slot="options" slot-scope="text, record">
          <div>
            <a-button type="primary" size="small" @click="edit(record)">编辑</a-button>
          </div>
        </span>
      </a-table>
    </a-spin>
    <create-job-group-form
      ref="createJobGroupModal"
      :visible="createJobGroupFormVisible"
      :model="mdl"
      @cancel="cancel"
      @ok="save"
    />
  </a-modal>
</template>

<script>
import { GET_JOB_GROUP_LIST, DELETE_JOB_GROUP_ITEM, POST_JOB_GROUP_ITEM, PUT_JOB_GROUP_ITEM } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import CreateJobGroupForm from "./CreateJobGroupForm";

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
  components: {
    CreateJobGroupForm,
  },
  data() {
    return {
      title: "任务分组管理",
      loading: false,
      //
      createJobGroupFormVisible: false,
      mdl: null,
      //
      data: [],
      columns: [
        {
          title: "分组名称",
          dataIndex: "name",
        },
        {
          title: "分组编码",
          dataIndex: "code",
          sorter: true,
        },
        {
          title: "创建时间",
          dataIndex: "createdTime",
        },
        {
          title: "操作",
          dataIndex: "options",
          scopedSlots: { customRender: "options" },
          fixed: "right",
          width: 90,
        },
      ],
      //分页
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
      selectedRowKeys: [],
    };
  },
  created() {
    //
  },
  watch: {
    pageSize() {
      this.load();
    },
    page() {
      this.load();
    },
  },
  methods: {
    load() {
      this.loading = true;
      request(GET_JOB_GROUP_LIST, METHOD.GET, {
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
          this.data = resultData.data.pageData;
          this.pagination.total = resultData.data.count;
          this.selectedRowKeys.splice(0);
          this.loading = false;
        })
        .catch((error) => {
          console.error(error);
          this.loading = false;
        });
    },
    add() {
      this.createJobGroupFormVisible = true;
      this.$nextTick(() => {
        this.mdl = { type: "create", data: null };
      });
    },
    edit(record) {
      this.createJobGroupFormVisible = true;
      this.$nextTick(() => {
        this.mdl = { type: "update", data: record };
      });
    },
    save() {
      const form = this.$refs.createJobGroupModal.form;
      this.$refs.createJobGroupModal.loading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          if (values.id > 0) {
            // 修改 e.g.
            request(PUT_JOB_GROUP_ITEM, METHOD.PUT, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createJobGroupModal.loading = false;
                  return;
                }
                this.load(false);
                this.createJobGroupFormVisible = false;
                this.$refs.createJobGroupModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("定时任务分组修改成功");
              })
              .catch(() => {
                this.$refs.createJobGroupModal.loading = false;
              });
          } else {
            request(POST_JOB_GROUP_ITEM, METHOD.POST, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createJobGroupModal.loading = false;
                  return;
                }
                this.load(false);
                this.createJobGroupFormVisible = false;
                this.$refs.createJobGroupModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("定时任务分组创建成功");
              })
              .catch(() => {
                this.$refs.createJobGroupModal.loading = false;
              });
          }
        } else {
          this.$refs.createJobGroupModal.loading = false;
        }
      });
    },
    cancel() {
      this.createJobGroupFormVisible = false;
      const form = this.$refs.createJobGroupModal.form;
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
        onOk() {
          return request(DELETE_JOB_GROUP_ITEM, METHOD.DELETE, delArgs).then((result) => {
            let resultData = result.data;
            if (resultData.code != 0) {
              return;
            }
            self.$message.success("删除成功");
            self.load(false);
          });
        },
        onCancel() {},
      });
    },
    onSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    onTableChange(pagination, filters, sorter) {
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
/deep/ .ant-modal-body {
  padding: 0px;
}

/deep/ .ant-tooltip-inner {
  width: 500px;
}
</style>
