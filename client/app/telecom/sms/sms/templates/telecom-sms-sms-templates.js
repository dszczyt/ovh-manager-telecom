angular.module("managerApp").config(function ($stateProvider) {
    "use strict";

    $stateProvider.state("telecom.sms.sms.templates", {
        url: "/templates",
        views: {
            "@smsView": {
                templateUrl: "app/telecom/sms/sms/templates/telecom-sms-sms-templates.html",
                controller: "TelecomSmsSmsTemplatesCtrl",
                controllerAs: "SmsTemplates"
            }
        },
        translations: ["common", "telecom/sms/sms/templates"]
    });
});
