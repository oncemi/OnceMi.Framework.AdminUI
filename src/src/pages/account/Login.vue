<template>
  <div></div>
</template>
<script>
import { getUserRoutes } from "@/services/user";
import { loadRoutes } from "@/utils/routerUtil";
import { login } from "@/services/auth";
import { checkAuthorization } from "@/utils/request";
export default {
  name: "Login",
  data() {
    return {};
  },
  mounted: function() {
    var self = this;
    if (checkAuthorization()) {
      getUserRoutes()
        .then((result) => {
          loadRoutes(result.data.data);
          const redirect = self.$route.query?.redirect ? self.$route.query.redirect : "/dashboard/analysis";
          self.$router.push(redirect);
        })
        .catch(function(error) {
          self.$router.push("/403");
        });
    } else {
      login();
    }
  },
};
</script>
