angular.module("managerApp").config(function ($stateProvider) {
    "use strict";

    $stateProvider.state("telecom.telephony.alias.contact", {
        url: "/contact",
        views: {
            aliasInnerView: {
                templateUrl: "app/telecom/telephony/service/contact/telecom-telephony-service-contact.html",
                controller: "TelecomTelephonyServiceContactCtrl",
                controllerAs: "ServiceContactCtrl"
            }
        },
        translations: ["common", "telecom/telephony/service/contact"]
    });
});
