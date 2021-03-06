angular.module("managerApp").component("toggleSwitch", {
    templateUrl: "components/toggleSwitch/toggleSwitch.html",
    bindings: {
        ngModel: "=?",
        ngDisabled: "=?"
    },
    controller: function () {
        "use strict";

        this.id = _.uniqueId("toggleSwitch");
    }
});
