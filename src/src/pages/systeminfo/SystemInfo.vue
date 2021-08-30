<template>
  <page-layout title="系统信息">
    <a-card :bordered="true" :loading="loading">
      <detail-list title="基本信息">
        <detail-list-item term="操作系统">{{ hardwareInfo.osDescription }}</detail-list-item>
        <detail-list-item term="操作系统架构">{{ hardwareInfo.osArchitecture }}</detail-list-item>
        <detail-list-item term="应用程序架构">{{ hardwareInfo.processArchitecture }}</detail-list-item>
        <detail-list-item term="内存总数">{{ hardwareInfo.totalPhysicalMemory }} MB</detail-list-item>
        <detail-list-item term="空闲内存">{{ hardwareInfo.availablePhysicalMemory }} MB</detail-list-item>
        <detail-list-item term="应用程序占用">{{ hardwareInfo.processUsedMemory }} MB</detail-list-item>
        <detail-list-item term="CPU型号">{{ cpuinfo.name }}</detail-list-item>
        <detail-list-item term="CPU时钟频率">{{ cpuinfo.maxClockSpeed }} GHz</detail-list-item>
        <detail-list-item term="CPU核心数">{{ cpuinfo.numberOfCores }}</detail-list-item>
        <detail-list-item term="开机时间"
          >{{ parseInt(hardwareInfo.osTickMins / 60 / 24) }}天{{ parseInt((hardwareInfo.osTickMins / 60) % 24) }}小时{{
            parseInt(hardwareInfo.osTickMins % 60)
          }}分钟</detail-list-item
        >
        <detail-list-item term="应用程序目录">{{ hardwareInfo.processPath }}</detail-list-item>
      </detail-list>
      <a-divider style="margin-bottom: 32px" />
      <detail-list title="授权信息">
        <detail-list-item term="授权给">基于开源软件协议（MIT）内的任何人</detail-list-item>
        <detail-list-item term="授权到期时间">永久</detail-list-item>
      </detail-list>
      <!-- <a-divider style="margin-bottom: 32px" /> -->
    </a-card>
  </page-layout>
</template>

<script>
import { GET_SYSTEM_HARDWARE_INFO } from "@/services/api";
import { request, METHOD } from "@/utils/request";
import DetailList from "../../components/tool/DetailList";
import PageLayout from "../../layouts/PageLayout";

const DetailListItem = DetailList.Item;

export default {
  name: "SystemInfo",
  components: { PageLayout, DetailListItem, DetailList },
  i18n: require("./i18n"),
  data() {
    return {
      //卡片
      loading: false,
      hardwareInfo: {},
      cpuinfo: {
        name: "",
        maxClockSpeed: 0,
        numberOfCores: 0,
      },
    };
  },
  authorize: {
    //deleteRecord: "delete",
  },
  created() {
    this.load();
  },
  methods: {
    load() {
      this.loading = true;
      request(GET_SYSTEM_HARDWARE_INFO, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.hardwareInfo = result.data.data;
        if (this.hardwareInfo.cpuInfos.length > 0) {
          this.cpuinfo = this.hardwareInfo.cpuInfos[0];
        }
        this.loading = false;
      });
    },
  },
};
</script>
