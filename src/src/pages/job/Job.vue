<template>
  <a-spin :spinning="spinning" size="large">
    <a-card>
      <div :class="advanced ? 'search' : null">
        <a-form layout="horizontal">
          <div :class="advanced ? null : 'fold'">
            <a-row>
              <a-col :md="10" :sm="24" v-if="false">
                <a-form-item label="状态" :labelCol="{ span: 5 }" :wrapperCol="{ span: 16, offset: 1 }">
                  <a-select v-model="paramStatus" placeholder="请选择">
                    <a-select-option value="">请选择</a-select-option>
                    <a-select-option value="1">启用</a-select-option>
                    <a-select-option value="2">禁用</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="10" :sm="24">
                <a-form-item label="关键字" :labelCol="{ span: 5 }" :wrapperCol="{ span: 16, offset: 1 }">
                  <a-input v-model="paramKeyword" placeholder="请输入" />
                </a-form-item>
              </a-col>
            </a-row>
          </div>
          <span style="float: right;">
            <a-button type="primary" icon="search" @click="load(false)">查询</a-button>
            <a-button style="margin-left: 8px" @click="reset">重置</a-button>
            <a @click="toggleAdvanced" style="margin-left: 8px">
              {{ advanced ? "收起" : "展开" }}
              <a-icon :type="advanced ? 'up' : 'down'" />
            </a>
          </span>
        </a-form>
      </div>
      <div>
        <a-row>
          <a-col :span="12">
            <a-space class="operator">
              <a-button @click="add" type="primary" icon="form">新建</a-button>
              <a-button @click="deleteSelectItems" type="danger" icon="delete">删除</a-button>
              <a-button @click="jobGroupEdit" icon="appstore">分组管理</a-button>
            </a-space>
          </a-col>
          <a-col :span="12" style="text-align: right;">
            <div style="margin-top: 5px;">
              自动刷新： <a-switch v-model="isEnableAutoRefesh" @change="onAutoRefeshChange" />
            </div>
          </a-col>
        </a-row>

        <div>
          <a-table
            :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            :columns="columns"
            :data-source="data"
            :pagination="pagination"
            :sortDirections="['descend', 'ascend']"
            :loading="loading"
            :scroll="{ scrollToFirstRowOnChange: true, x: 1600, y: 500 }"
            rowKey="id"
            @change="onChange"
          >
            <span slot="ellipsisCol" slot-scope="text">
              <a-tooltip placement="topLeft" :autoAdjustOverflow="true">
                <template slot="title">
                  {{ text }}
                </template>
                {{ text }}
              </a-tooltip>
            </span>
            <span slot="status" slot-scope="status">
              <a-tag v-if="status == 'Stopped'" color="red">已停止</a-tag>
              <a-tag v-if="status == 'Paused'" color="orange">已暂停</a-tag>
              <a-tag v-if="status == 'Running'" color="green">运行中</a-tag>
              <a-tag v-if="status == 'Waiting'" color="cyan">等待中</a-tag>
            </span>
            <span slot="options" slot-scope="text, record">
              <div>
                <a-button-group>
                  <a-button type="primary" size="small" ghost @click="edit(record)">编辑</a-button>
                  <a-button type="primary" size="small" ghost @click="pauseOrResume(record)">
                    {{ record.status == "Running" || record.status == "Waiting" ? "暂停" : "继续" }}
                  </a-button>
                  <a-dropdown>
                    <a-menu slot="overlay" @click="(e) => handleMenuClick(e, record)">
                      <a-menu-item key="logs">
                        查看日志
                      </a-menu-item>
                      <a-menu-item key="trigger">
                        立即运行
                      </a-menu-item>
                      <a-menu-item key="stop">
                        停止
                      </a-menu-item>
                      <a-menu-item key="delete">
                        删除
                      </a-menu-item>
                    </a-menu>
                    <a-button type="primary" size="small" ghost> 更多 <a-icon type="down" /> </a-button>
                  </a-dropdown>
                </a-button-group>
              </div>
            </span>
          </a-table>
        </div>
      </div>
      <create-form ref="createModal" :visible="visible" :model="mdl" @cancel="cancel" @ok="save" />
      <job-history-form ref="jobHistoryForm" :visible="jobHistoryVisible" @cancel="closeJobHistory" />
      <job-group-form ref="jobGroupForm" :visible="jobGroupVisible" @cancel="jobGroupClose" />
    </a-card>
  </a-spin>
</template>

<script>
import {
  GET_JOB_LIST,
  DELETE_JOB_ITEM,
  POST_JOB_ITEM,
  PUT_JOB_ITEM,
  POST_STOP_JOB,
  POST_PAUSE_JOB,
  POST_RESUME_JOB,
  POST_TRIGGER_JOB,
} from "@/services/api";
import { request, METHOD } from "@/utils/request";
import CreateForm from "./modules/CreateForm";
import JobHistoryForm from "./modules/JobHistoryForm";
import JobGroupForm from "./modules/JobGroupForm";
export default {
  name: "JobManagement",
  i18n: require("./i18n"),
  components: {
    CreateForm,
    JobHistoryForm,
    JobGroupForm,
  },
  data() {
    return {
      //定时刷新
      isEnableAutoRefesh: true,
      timer: 0,
      //操作加载
      spinning: false,
      //展开/关闭高级搜素
      advanced: false,
      data: [],
      columns: [
        {
          title: "名称",
          dataIndex: "name",
        },
        {
          title: "分组",
          dataIndex: "groupName",
        },
        {
          title: "状态",
          dataIndex: "status",
          width: 80,
          scopedSlots: { customRender: "status" },
        },
        {
          title: "上次执行",
          dataIndex: "lastFireTime",
        },
        {
          title: "下次执行",
          dataIndex: "nextFireTime",
          sorter: true,
        },
        {
          title: "请求路径",
          dataIndex: "url",
          ellipsis: true,
          scopedSlots: { customRender: "ellipsisCol" },
        },
        {
          title: "请求方式",
          dataIndex: "requestMethod",
          width: 90,
        },
        {
          title: "Crontab",
          dataIndex: "cron",
        },
        {
          title: "开始时间",
          dataIndex: "startTime",
          sorter: true,
        },
        {
          title: "到期时间",
          dataIndex: "endTime",
          sorter: true,
        },
        {
          title: "发送通知",
          dataIndex: "noticePolicy",
          width: 90,
          customRender: (value, row, index) => {
            if (!value || value.length == 0) {
              return "";
            }
            switch (value) {
              case "1":
              case "No":
                return "不发送";
              case "2":
              case "Error":
                return "仅失败";
              case "4":
              case "All":
                return "全部";
              default:
                return "未知";
            }
          },
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
      //作业记录弹窗
      jobHistoryVisible: false,
      //任务分组管理
      jobGroupVisible: false,
    };
  },
  watch: {
    pageSize() {
      this.load(false);
    },
    page() {
      this.load(false);
    },
    isEnableAutoRefesh(value, oldValue) {
      //开关自动刷新
      this.autoRefesh();
    },
  },
  authorize: {
    deleteRecord: "delete",
  },
  created() {
    this.load(false);
  },
  mounted() {
    //定时刷新
    this.autoRefesh();
  },
  methods: {
    autoRefesh() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      if (!this.isEnableAutoRefesh) {
        return;
      }
      var selt = this;
      this.timer = setInterval(() => {
        selt.load(true);
      }, 3000);
    },
    load(isAutoReload) {
      this.loading = !isAutoReload;
      request(GET_JOB_LIST, METHOD.GET, {
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
          this.pagination.total = resultData.data.count;
          this.loading = false;
        })
        .catch((error) => {
          //this.$message.error(error.message);
          this.loading = false;
        });
    },
    reset() {
      this.paramStatus = "";
      this.paramKeyword = "";
      this.load(false);
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
          if (values.id > 0) {
            // 修改 e.g.
            request(PUT_JOB_ITEM, METHOD.PUT, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createModal.loading = false;
                  return;
                }
                this.load(false);
                this.visible = false;
                this.$refs.createModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("定时任务修改成功");
              })
              .catch(() => {
                this.$refs.createModal.loading = false;
              });
          } else {
            request(POST_JOB_ITEM, METHOD.POST, values)
              .then((result) => {
                if (result.data.code != 0) {
                  this.$refs.createModal.loading = false;
                  return;
                }
                this.load(false);
                this.visible = false;
                this.$refs.createModal.loading = false;
                // 重置表单数据
                form.resetFields();
                this.$message.success("定时任务创建成功");
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
    stop(record) {
      let self = this;
      self.$confirm({
        title: `确认停止任务【${record.name}】吗？`,
        onOk() {
          return new Promise((resolve, reject) => {
            request(POST_STOP_JOB, METHOD.POST, {
              id: record.id,
            }).then((result) => {
              let resultData = result.data;
              if (resultData.code != 0) {
                reject();
                return;
              }
              self.load(false);
              resolve();
              self.$message.info(`任务【${record.name}】已停止`);
            });
          }).catch((err) => {
            this.$message.error(err.message);
            console.error(err);
          });
        },
        onCancel() {},
      });
    },
    trigger(record) {
      request(POST_TRIGGER_JOB, METHOD.POST, {
        id: record.id,
      }).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.load(false);
        this.$message.info(`任务【${record.name}】已经开始运行`);
      });
    },
    viewJobHistory(record) {
      this.jobHistoryVisible = true;
      this.$nextTick(() => {
        this.$refs.jobHistoryForm.load(record.id);
      });
    },
    closeJobHistory() {
      this.jobHistoryVisible = false;
    },
    pauseOrResume(record) {
      let requestUrl = "";
      let msg = "";
      if (record.status == "Running" || record.status == "Waiting") {
        //暂停
        requestUrl = POST_PAUSE_JOB;
        msg = `任务【${record.name}】已暂停`;
      } else {
        //恢复
        requestUrl = POST_RESUME_JOB;
        msg = `任务【${record.name}】已恢复`;
      }
      this.spinning = true;
      request(requestUrl, METHOD.POST, {
        id: record.id,
      }).then((result) => {
        this.spinning = false;
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.load(false);
        this.$message.success(msg);
      });
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
          return new Promise((resolve, reject) => {
            return request(DELETE_JOB_ITEM, METHOD.DELETE, delArgs).then((result) => {
              let resultData = result.data;
              if (resultData.code != 0) {
                reject();
                return;
              }
              resolve();
              self.$message.success("删除成功");
              self.load(false);
            });
          }).catch((err) => {
            this.$message.error(err.message);
            console.error(err);
          });
        },
        onCancel() {},
      });
    },
    jobGroupEdit() {
      this.jobGroupVisible = true;
      this.$nextTick(() => {
        this.$refs.jobGroupForm.load();
      });
    },
    jobGroupClose() {
      this.jobGroupVisible = false;
    },
    handleMenuClick(e, record) {
      switch (e.key) {
        case "logs":
          this.viewJobHistory(record);
          break;
        case "delete":
          this.deleteWithConfirm(record);
          break;
        case "stop":
          this.stop(record);
          break;
        case "trigger":
          this.trigger(record);
          break;
      }
    },
    onSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    toggleAdvanced() {
      this.advanced = !this.advanced;
    },
    onAutoRefeshChange(checked) {
      this.$message.info(`自动刷新已${checked ? "开启" : "关闭"}`);
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
        this.load(false);
      }
    },
  },
  destroyed() {
    clearInterval(this.timer);
  },
};
</script>

<style scoped lang="less">
@import "index";
</style>
