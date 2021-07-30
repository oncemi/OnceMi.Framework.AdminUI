<template>
  <div></div>
</template>
<script>
import { userManager } from "@/services/auth";
import { setAuthorization } from "@/utils/request";

export default {
  name: "RefreshToken",
  data() {
    return {};
  },
  async created() {
    userManager.signinSilentCallback().then(
      function(user) {
        if (user == null) {
          console.log("Signin silent callback error: ", "result user is null");
          return;
        }
        setAuthorization(user);
      },
      (err) => {
        console.log("Error caught in signinSilentCallback().");
        console.error(err);
      }
    );
  },
};
</script>
