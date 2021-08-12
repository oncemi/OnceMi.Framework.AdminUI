<template>
  <a-row style="margin: 0 -12px">
    <a-col style="padding: 0 12px" :xl="6" :lg="6" :md="6" :sm="6" :xs="6">
      <a-card
        :title="$t('roleList')"
        :loading="loadingRoles"
        style="margin-bottom: 24px;"
        :bordered="false"
        :body-style="{ padding: 0 }"
      >
        <div slot="extra">
          <a-button @click="reload" type="link" class="display-role-refesh" cl>{{ $t("refeshRole") }}</a-button>
        </div>
        <div>
          <template>
            <div>
              <a-input-search style="margin-bottom: 8px" placeholder="Search" @change="onRoleSearchChange" />
              <div class="main-tree">
                <a-tree
                  :multiple="false"
                  show-icon
                  :defaultExpandAll="true"
                  :expandedKeys="roleExpandedKeys"
                  :autoExpandParent="autoExpandRoleParent"
                  :selected-keys="selectedRoleKeys"
                  :treeData="roleData"
                  :replaceFields="{
                    children: 'children',
                    title: 'label',
                    key: 'id',
                  }"
                  @expand="onRoleTreeExpand"
                  @select="onRoleTreeSelect"
                  :icon="getIcon"
                >
                  <template slot="label" slot-scope="{ label }">
                    <span v-if="label.indexOf(searchRoleValue) > -1">
                      {{ label.substr(0, label.indexOf(searchRoleValue)) }}
                      <span style="color: #f50">{{ searchRoleValue }}</span>
                      {{ label.substr(label.indexOf(searchRoleValue) + searchRoleValue.length) }}
                    </span>
                    <span v-else>{{ label }}</span>
                  </template>
                </a-tree>
              </div>
            </div>
          </template>
        </div>
      </a-card>
    </a-col>
    <a-col style="padding: 0 12px" :xl="18" :lg="18" :md="18" :sm="18" :xs="18">
      <a-card
        :title="$t('permissions')"
        :loading="loadingPermissions"
        style="margin-bottom: 24px"
        :bordered="false"
        :body-style="{ padding: 0 }"
      >
        <div slot="extra">
          <a-button @click="reload" type="link">{{ $t("refeshPermissions") }}</a-button>
          <a-button @click="save" type="link">{{ $t("save") }}</a-button>
        </div>
        <div>
          <template>
            <div class="main-tree">
              <a-tree
                v-model="checkedKeys"
                checkable
                :checkStrictly="true"
                :disabled="disabled"
                :expanded-keys="expandedPermissionKeys"
                :auto-expand-parent="autoExpandPermissionParent"
                :selected-keys="selectedKeys"
                :tree-data="permissionData"
                :replaceFields="{
                  children: 'children',
                  title: 'label',
                  key: 'id',
                }"
                @expand="onPermissionExpand"
                @select="onPermissionSelect"
                @check="onPermissionCheck"
              />
            </div>
          </template>
        </div>
      </a-card>
    </a-col>
  </a-row>
</template>
<script>
import { GET_PERMISSION_LIST, GET_ROLE_PERMISSION, PUT_ROLE_PERMISSION } from "@/services/api";
import { request, METHOD } from "@/utils/request";

export default {
  name: "Permission",
  i18n: require("./i18n"),
  data() {
    return {
      loadingRoles: true,
      roleExpandedKeys: [],
      searchRoleValue: "",
      autoExpandRoleParent: true,
      selectedRoleKeys: [],
      roleData: [],
      roleDataList: [],
      loadingPermissions: true,
      expandedPermissionKeys: [],
      autoExpandPermissionParent: true,
      selectedKeys: [],
      checkedKeys: {
        checked: [],
        halfChecked: [],
      },
      permissionData: [],
      permissionListData: [],
      selectRoleId: 0,
      disabled: true,
    };
  },
  computed: {
    desc() {
      return this.$t("description");
    },
  },
  created() {
    this.reload();
  },
  watch: {
    checkedKeys(val) {
      //console.log("onWatch:", JSON.stringify(val));
      //this.checkedKeys = val;
    },
  },
  methods: {
    reload() {
      let self = this;
      request(GET_PERMISSION_LIST, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        self.searchRoleValue = "";
        self.roleExpandedKeys.splice(0);
        self.roleData.splice(0);
        self.roleDataList.splice(0);
        self.selectedRoleKeys.splice(0);
        self.roleData = result.data.data.roles;
        self.generateRoleList(self.roleData);
        self.loadingRoles = false;

        self.expandedPermissionKeys.splice(0);
        self.selectedKeys.splice(0);
        self.checkedKeys.checked.splice(0);
        self.permissionData.splice(0);
        self.autoExpandPermissionParent = false;
        self.permissionData = result.data.data.menus;
        self.generatePermissionList(self.permissionData);
        self.loadingPermissions = false;

        self.selectRoleId = 0;
        self.disabled = true;
      });
    },
    save() {
      if (this.selectRoleId == null || this.selectRoleId == 0) {
        this.$message.warning("请先选择一个角色");
        return;
      }
      if (this.disabled) {
        this.$message.warning("权限不足");
        return;
      }
      let putData = {
        roleId: this.selectRoleId,
        permissions: this.checkedKeys.checked,
      };
      request(PUT_ROLE_PERMISSION, METHOD.PUT, putData).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.$message.success("保存成功");
      });
    },
    onRoleTreeExpand(expandedKeys) {
      this.roleExpandedKeys = expandedKeys;
      this.autoExpandRoleParent = false;
    },
    onRoleSearchChange(e) {
      const value = e.target.value;
      const expandedKeys = this.roleDataList
        .map((item) => {
          if (item.label.indexOf(value) > -1) {
            return this.getParentKey(item.key, this.roleData);
          }
          return null;
        })
        .filter((item, i, a) => item && a.indexOf(item) === i);
      Object.assign(this, {
        roleExpandedKeys: expandedKeys,
        searchRoleValue: value,
        autoExpandRoleParent: true,
      });
    },
    onRoleTreeSelect(keys, event) {
      if (keys == null || keys.length == 0) {
        return;
      }
      this.selectedRoleKeys = keys;
      this.selectRoleId = keys[0];
      request(`${GET_ROLE_PERMISSION}${this.selectRoleId}`, METHOD.GET).then((result) => {
        if (result.data.code != 0) {
          return;
        }
        this.disabled = false;
        this.checkedKeys.checked.splice(0);
        for (let i = 0; i < result.data.data.length; i++) {
          this.checkedKeys.checked.push(result.data.data[i]);
        }
      });
    },
    onPermissionExpand(expandedKeys) {
      this.expandedPermissionKeys = expandedKeys;
      this.autoExpandPermissionParent = false;
    },
    onPermissionSelect(selectedKeys) {
      this.selectedKeys = selectedKeys;
    },
    onPermissionCheck(checkedKeys, e) {
      let { checked, node } = e;
      this.checkedKeys = checkedKeys;
      if (node.$options?.propsData?.eventKey == null) {
        return;
      }
      let item = this.permissionListData.find((item, index) => {
        return item.id === node?.$options?.propsData?.eventKey;
      });
      if (item == null) {
        return;
      }
      if (checked) {
        let parentKeys = [];
        let parentKey = item.parentId;
        do {
          for (let i = 0; i < this.permissionListData.length; i++) {
            if (this.permissionListData[i].id === parentKey) {
              parentKeys.push(this.permissionListData[i].id);
              parentKey = this.permissionListData[i].parentId;
              break;
            }
          }
        } while (parentKey != null && parentKey > 0);
        if (parentKeys.length > 0) {
          for (let i = 0; i < parentKeys.length; i++) {
            if (this.checkedKeys.checked.indexOf(parentKeys[i]) == -1) {
              this.checkedKeys.checked.push(parentKeys[i]);
            }
          }
        }
      } else {
        //反选，如果反选的是父节点，需要将父节点下面的子节点全部设置为反选
        let childrenKeys = [];
        let childrenObj = [item];
        do {
          let temp = [];
          for (let j = 0; j < childrenObj.length; j++) {
            for (let i = 0; i < this.permissionListData.length; i++) {
              if (
                this.permissionListData[i].parentId != null &&
                this.permissionListData[i].parentId > 0 &&
                this.permissionListData[i].parentId == childrenObj[j].id
              ) {
                childrenKeys.push(this.permissionListData[i].id);
                temp.push(this.permissionListData[i]);
              }
            }
          }
          childrenObj = temp;
        } while (childrenObj.length > 0);
        if (childrenKeys.length > 0) {
          childrenKeys.forEach((key) => {
            if (this.checkedKeys.checked.indexOf(key) > -1) {
              this.checkedKeys.checked.splice(
                this.checkedKeys.checked.findIndex((oldKey) => oldKey === key),
                1
              );
            }
          });
        }
      }
    },
    getParentKey(id, tree) {
      let parentKey = null;
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
          if (node.children.some((item) => item.id === id)) {
            parentKey = node.id;
          } else if (this.getParentKey(id, node.children)) {
            parentKey = this.getParentKey(id, node.children);
          }
        }
      }
      return parentKey;
    },
    generateRoleList(data) {
      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const key = node.id;
        const label = node.label;
        this.roleDataList.push({ key, label: label });
        if (node.children && node.children.length > 0) {
          this.roleExpandedKeys.push(key);
          this.generateRoleList(node.children);
        }
      }
    },
    generatePermissionList(data) {
      for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const key = node.id;
        this.permissionListData.push(node);
        if (node.children && node.children.length > 0) {
          this.expandedPermissionKeys.push(key);
          this.generatePermissionList(node.children);
        }
      }
    },
    getIcon(props) {
      const { expanded, children } = props;
      if (children && children.length > 0) {
        return <a-icon type={expanded ? "folder-open" : "folder"} />;
      } else {
        return <a-icon type="user" />;
      }
    },
  },
};
</script>

<style scoped lang="less">
@import "index.less";

.main-tree {
  max-height: 500px;
  overflow-y: auto;
}
</style>
