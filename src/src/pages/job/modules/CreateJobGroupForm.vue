<template>
  <a-modal
    :title="title"
    :width="450"
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
      <a-form :form="form" v-bind="formLayout" style="margin-top: 8px">
        <a-form-item v-show="false" label="主键ID">
          <a-input v-decorator="['id', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="名称">
          <a-input
            v-decorator="['name', { rules: [{ required: true, min: 2, message: '分组名称不能少于两个字！' }] }]"
            placeholder="分组名称"
          />
        </a-form-item>
        <a-form-item label="编码" help="分组的唯一编码，创建后无法修改。">
          <a-input
            v-decorator="['code', { rules: [{ required: true }] }]"
            placeholder="只能由字母、数组和下划线组成"
            :disabled="codeInputStatus"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from "lodash.pick";
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
      title: "创建任务分组",
      fields: ["id", "name", "code"],
      loading: false,
      form: this.$form.createForm(this),
      codeInputStatus: true,
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
        this.title = "编辑任务分组";
        this.form.setFieldsValue(pick(this.model.data, this.fields));
        this.codeInputStatus = true;
        this.load();
      } else {
        this.title = "创建任务分组";
        this.load();
        this.codeInputStatus = false;
      }
    });
  },
  methods: {
    load() {
      this.loading = false;
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
