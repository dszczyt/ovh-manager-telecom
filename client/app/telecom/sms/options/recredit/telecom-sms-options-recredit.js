angular.module("managerApp").config(function ($stateProvider) {
    "use strict";

    $stateProvider.state("telecom.sms.options.recredit", {
        url: "/recredit",
        views: {
            "@smsView": {
                templateUrl: "app/telecom/sms/options/recredit/telecom-sms-options-recredit.html",
                controller: "TelecomSmsOptionsRecreditCtrl",
                controllerAs: "TelecomSmsOptionsRecreditCtrl"
            }
        },
        translations: ["common", "telecom/sms/options/recredit"]
    });
});
