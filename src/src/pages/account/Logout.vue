<template>
  <div></div>
</template>
<script>
import { mapState } from "vuex";
import { logout, localLogout } from "@/services/auth";
export default {
  name: "Logout",
  data() {
    return {};
  },
  computed: {
    ...mapState("setting", ["isEnabledIdentityServer"]),
  },
  mounted: async function () {
    if (this.isEnabledIdentityServer) {
      await logout().then((result) => {
        this.$router.push("/login");
      });
    } else {
      await localLogout();
      this.$router.push("/login");
    }
  },
};
</script>
