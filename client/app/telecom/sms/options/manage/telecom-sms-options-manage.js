angular.module("managerApp").config(function ($stateProvider) {
    "use strict";

    $stateProvider.state("telecom.sms.options.manage", {
        url: "/manage",
        views: {
            "@smsView": {
                templateUrl: "app/telecom/sms/options/manage/telecom-sms-options-manage.html",
                controller: "TelecomSmsOptionsManageCtrl",
                controllerAs: "TelecomSmsOptionsManageCtrl"
            }
        },
        translations: ["common", "telecom/sms/options/manage"]
    });
});
