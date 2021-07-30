<template>
  <div></div>
</template>
<script>
import { logout } from "@/services/auth";
import { checkAuthorization } from "@/utils/request";
export default {
  name: "Logout",
  data() {
    return {};
  },
  mounted: function() {
    if (!checkAuthorization()) {
      this.$router.push("/login");
    } else {
      logout();
    }
  },
};
</script>
