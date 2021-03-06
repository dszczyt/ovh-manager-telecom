angular.module("managerApp").config(function ($stateProvider) {
    "use strict";

    $stateProvider.state("telecom.sms.sms.outgoing", {
        url: "/outgoing",
        views: {
            "@smsView": {
                templateUrl: "app/telecom/sms/sms/outgoing/telecom-sms-sms-outgoing.html",
                controller: "TelecomSmsSmsOutgoingCtrl",
                controllerAs: "SmsOutgoingCtrl"
            }
        },
        translations: ["common", "telecom/sms/sms/outgoing"]
    });
});
