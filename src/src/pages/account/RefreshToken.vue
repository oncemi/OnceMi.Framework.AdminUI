<template>
  <div></div>
</template>
<script>
import { userManager } from "@/services/auth";
import { mapMutations } from "vuex";

export default {
  name: "RefreshToken",
  data() {
    return {};
  },
  async created() {
    userManager.signinSilentCallback().then(
      function(userToken) {
        if (userToken == null) {
          console.log("Signin silent callback error: ", "result user is null");
          return;
        }
        this.setToken(userToken);
      },
      (err) => {
        console.log("Error caught in signinSilentCallback().");
        console.error(err);
      }
    );
  },
  methods: {
    ...mapMutations("account", ["setToken"]),
  },
};
</script>
