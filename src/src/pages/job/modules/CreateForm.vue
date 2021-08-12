<template>
  <a-modal
    :title="title"
    :width="580"
    :visible="visible"
    :confirmLoading="loading"
    :maskClosable="false"
    :destroyOnClose="true"
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
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '作业名称不能少于两个字！' }] }]"
            placeholder="任务名称"
          />
        </a-form-item>
        <a-form-item label="分组">
          <a-select v-decorator="['groupId', { rules: [{ required: true }] }]" placeholder="任务组">
            <a-select-option v-for="item in groupSelectList" :key="item.value">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Cron" help="表达式生成器：https://www.bejson.com/othertools/cron/">
          <a-input v-decorator="['cron', { rules: [{ required: true }] }]" placeholder="例：0/10 * * * * ? " />
        </a-form-item>
        <a-form-item label="开始时间">
          <a-date-picker
            show-time
            v-decorator="['startTime', { rules: [{ required: false }] }]"
            placeholder="可选，开始时间"
          />
        </a-form-item>
        <a-form-item label="到期时间">
          <a-date-picker
            show-time
            v-decorator="['endTime', { rules: [{ required: false }] }]"
            placeholder="可选，到期时间"
          />
        </a-form-item>
        <a-form-item label="请求地址">
          <a-input
            v-decorator="['url', { rules: [{ required: true }] }]"
            placeholder="支持本地地址（/xx/xx）和远程地址（http://baidu...）"
          />
        </a-form-item>
        <a-form-item label="请求方式">
          <a-radio-group v-decorator="['requestMethod', { rules: [{ required: true, initialValue: 'Get' }] }]">
            <a-radio value="Get">
              Get
            </a-radio>
            <a-radio value="Post">
              Post
            </a-radio>
            <a-radio value="Put">
              Put
            </a-radio>
            <a-radio value="Delete">
              Delete
            </a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="请求头">
          <a-input
            v-decorator="['requestHeader', { rules: [{ required: false }] }]"
            placeholder="可选，请求头，Json格式"
          />
        </a-form-item>
        <a-form-item label="请求参数">
          <a-input
            v-decorator="['requestParam', { rules: [{ required: false }] }]"
            placeholder="可选，请求参数，Json格式"
          />
        </a-form-item>
        <a-form-item label="发送通知">
          <a-radio-group v-decorator="['noticePolicy', { rules: [{ required: true, initialValue: 'No' }] }]">
            <a-radio value="No">
              不发送
            </a-radio>
            <a-radio value="Error">
              仅异常
            </a-radio>
            <a-radio value="All">
              全部发送
            </a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-show="false" label="角色组Id">
          <a-input v-decorator="['noticeRoleId', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="通知角色组">
          <template>
            <a-cascader
              :value="groupIdSelect"
              ref="cascader"
              :options="groupOptions"
              change-on-select
              @change="onRoleSelectChange"
              :field-names="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="将发送通知到所选角色组"
            />
          </template>
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
import moment from "moment";
import { GET_ROLE_CASCADER, GET_JOB_GROUP_SELECT_LIST } from "@/services/api";
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
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 },
      },
    };
    return {
      title: "创建定时任务",
      fields: [
        "id",
        "name",
        "groupId",
        "cron",
        "startTime",
        "endTime",
        "url",
        "requestMethod",
        "requestHeader",
        "requestParam",
        "noticePolicy",
        "noticeRoleId",
        "isEnabled",
      ],
      loading: false,
      form: this.$form.createForm(this),
      groupIdSelect: [],
      groupOptions: [],
      groupListData: [],
      //任务分组
      groupSelectList: [],
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
      //pick 从model中取出表单中对应值
      if (this.model.type === "update") {
        //将string datetime转换为moment
        if (this.model.data.startTime && this.model.data.startTime.length > 0)
          this.model.data.startTime = moment(this.model.data.startTime, "YYYY-MM-DD HH:mm:ss");
        if (this.model.data.endTime && this.model.data.endTime.length > 0)
          this.model.data.endTime = moment(this.model.data.endTime, "YYYY-MM-DD HH:mm:ss");

        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.load();
      } else {
        //设置请求方式默认值，requestMethod
        this.form.setFieldsValue({ requestMethod: "Get" });
        //设置发送通知默认值，noticePolicy
        this.form.setFieldsValue({ noticePolicy: "No" });
        this.load();
      }
    });
  },
  methods: {
    load() {
      this.groupIdSelect = [];
      this.loading = true;
      request(GET_ROLE_CASCADER, METHOD.GET).then((result) => {
        let resultData = result.data;
        if (resultData.code != 0) {
          return;
        }
        this.groupOptions.splice(0);
        this.groupOptions = resultData.data;
        this.groupListData.splice(0);
        this.generateGroupList(this.groupOptions);
        this.setCascader("noticeRoleId", this.groupListData, this.groupIdSelect);

        request(GET_JOB_GROUP_SELECT_LIST, METHOD.GET).then((groupResult) => {
          if (groupResult.data.code != 0) {
            return;
          }
          this.groupSelectList.splice(0);
          groupResult.data.data.forEach((r) => {
            this.groupSelectList.push(r);
          });
          this.loading = false;
        });
      });
    },
    generateGroupList(data) {
      for (let i = 0; i < data.length; i++) {
        this.groupListData.push(data[i]);
        if (data[i].children && data[i].children.length > 0) {
          this.generateGroupList(data[i].children);
        }
      }
    },
    setCascader(fieldName, data, selectList) {
      let noticeRoleId = this.form.getFieldValue(fieldName);
      if (!noticeRoleId || noticeRoleId <= 0) {
        return;
      }
      let parentKeys = [];
      do {
        for (let i = 0; i < data.length; i++) {
          if (data[i].id === noticeRoleId) {
            parentKeys.push(data[i].id);
            noticeRoleId = data[i].noticeRoleId;
            break;
          }
        }
      } while (noticeRoleId != null && noticeRoleId > 0);
      if (parentKeys.length > 0) {
        for (let i = parentKeys.length - 1; i >= 0; i--) {
          selectList.push(parentKeys[i]);
        }
      }
    },
    onRoleSelectChange(value) {
      this.groupIdSelect = value;
      if (!value || value.length == 0) {
        this.form.setFieldsValue({ noticeRoleId: 0 });
        return;
      }
      this.form.setFieldsValue({ noticeRoleId: value[value.length - 1] });
    },
  },
};
</script>

<style scoped lang="less">
.ant-calendar-picker {
  width: 100%;
}

/deep/ .ant-modal-body {
  padding: 10px;
}
</style>
