<template>
  <a-modal
    title="编辑Cron表达式"
    :width="650"
    :visible="visible"
    :closable="true"
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
    <crontab v-model="crontabValue" :render="visible" />
  </a-modal>
</template>

<script>
import Vue from "vue";
import crontab from "vue-crontab-ui";

Vue.use(crontab);

export default {
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    model: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      crontabValue: "",
    };
  },
  created() {
    this.$watch("model", () => {
      if (!this.model) {
        this.$message.warning("加载Cron表达式失败");
        return;
      }
      this.crontabValue = this.model.value;
    });
  },
  watch: {
    crontabValue(value) {
      if (!this.model) {
        return;
      }
      // 监听到表达式中值的变化
      this.model.value = value;
    },
  },
};
</script>
