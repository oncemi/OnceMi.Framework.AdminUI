<template>
  <div></div>
</template>
<script>
import { userManager, getUser } from "@/services/auth";
import { mapMutations } from "vuex";

export default {
  name: "RefreshToken",
  data() {
    return {};
  },
  async created() {
    userManager.signinSilentCallback().then(
      (userToken) => {
        if (!userToken) {
          getUser().then((result) => {
            if (!result) {
              console.log("Signin silent callback error: ", "result user is null");
              return;
            }
            console.log("Refesh token result:", JSON.stringify(result));
            this.setToken(result);
          });
          return;
        }
        console.log("Refesh token result:", JSON.stringify(userToken));
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
