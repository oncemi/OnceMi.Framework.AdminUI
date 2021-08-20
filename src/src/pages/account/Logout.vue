<template>
  <div></div>
</template>
<script>
import { mapState } from "vuex";
import { logout, localLogout } from "@/services/auth";
import { checkAuthorization } from "@/utils/request";
export default {
  name: "Logout",
  data() {
    return {};
  },
  computed: {
    ...mapState("setting", ["isEnabledIdentityServer"]),
  },
  mounted: async function() {
    if (!checkAuthorization()) {
      this.$router.push("/login");
    } else {
      if (this.isEnabledIdentityServer) {
        logout();
      } else {
        await localLogout();
      }
      this.$router.push("/login");
    }
  },
};
</script>
