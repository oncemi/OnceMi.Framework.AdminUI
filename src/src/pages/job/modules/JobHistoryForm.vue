<template>
  <a-modal
    :title="title"
    :width="1000"
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
    <a-spin :spinning="loading">
      <a-table
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
        <span slot="jobHistoryStatus" slot-scope="text, record">
          <p :style="getJobHistoryStatusColor(record.status)">
            {{ text }}
          </p>
        </span>
        <span slot="ellipsisCol" slot-scope="text">
          <a-tooltip
            placement="topLeft"
            :autoAdjustOverflow="true"
            :destroyTooltipOnHide="true"
            :overlayStyle="{ width: '500px' }"
            :mouseEnterDelay="0.5"
          >
            <template slot="title">
              {{ text }}
            </template>
            {{ text }}
          </a-tooltip>
        </span>
        <span slot="btnRefesh">
          <a-button type="primary"> 刷新 </a-button>
        </span>
      </a-table>
    </a-spin>
  </a-modal>
</template>

<script>
import { GET_JOB_HISTORY_LIST } from "@/services/api";
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
    return {
      title: "任务历史记录",
      loading: false,
      //
      data: [],
      columns: [
        {
          title: "任务阶段",
          dataIndex: "stageName",
          width: 80,
        },
        {
          title: "执行时间",
          dataIndex: "firedTime",
          width: 150,
          sorter: true,
        },
        {
          title: "结束时间",
          dataIndex: "endTime",
          width: 150,
          sorter: true,
        },
        {
          title: "耗时(ms)",
          dataIndex: "elapsed",
          width: 80,
        },
        {
          title: "执行状态",
          dataIndex: "statusName",
          width: 100,
          scopedSlots: { customRender: "jobHistoryStatus" },
        },
        {
          title: "执行结果（鼠标悬停查看完整结果）",
          dataIndex: "result",
          ellipsis: true,
          scopedSlots: { customRender: "ellipsisCol" },
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
      jobId: 0,
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
    getJobHistoryStatusColor(status) {
      switch (status) {
        case 1:
          return "color: green;";
        case 2:
          return "color: red;";
        case 3:
        default:
          return "";
      }
    },
    load(jobId) {
      this.loading = true;
      if (!jobId || jobId == 0) {
        jobId = this.jobId;
      } else {
        this.jobId = jobId;
      }
      request(GET_JOB_HISTORY_LIST, METHOD.GET, {
        jobId: jobId,
        page: this.page,
        size: this.pageSize,
        search: this.paramKeyword ?? this.paramKeyword,
        orderby:
          typeof this.orderFiled != "undefined" && this.orderFiled.length > 0 ? `${this.orderFiled},${this.sort}` : "",
      })
        .then((result) => {
          if (result.data.code != 0) {
            return;
          }
          this.data.splice(0);
          this.data = result.data.data.pageData;
          this.pagination.total = result.data.data.count;
          this.loading = false;
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
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
