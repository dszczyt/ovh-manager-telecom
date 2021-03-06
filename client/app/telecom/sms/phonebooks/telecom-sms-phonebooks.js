angular.module("managerApp").config(function ($stateProvider) {
    "use strict";

    $stateProvider.state("telecom.sms.phonebooks", {
        url: "/phonebooks",
        views: {
            smsInnerView: {
                templateUrl: "app/telecom/sms/phonebooks/telecom-sms-phonebooks.html",
                controller: "TelecomSmsPhonebooksCtrl",
                controllerAs: "PhonebooksCtrl"
            }
        },
        params: {
            bookKey: null
        },
        translations: ["common", "telecom/sms/phonebooks"]
    });
});
