angular.module("managerApp").controller("TelecomTelephonyBillingAccountAdministrationOptionsGroup", function ($q, $stateParams, $translate, Telephony, User, Toast) {
    "use strict";

    var self = this;

    var telephonyAttributes = ["creditThreshold", "description",
        "hiddenExternalNumber", "overrideDisplayedNumber"];

    /*= ==============================
    =            HELPERS            =
    ===============================*/

    function fetchSettings () {
        Telephony.Lexi().resetCache();
        Telephony.Lexi().resetQueryCache();
        return $q.all({
            telephony: Telephony.Lexi().get({ billingAccount: $stateParams.billingAccount }).$promise,
            user: User.Telephony().Settings().Lexi().get().$promise
        });
    }

    self.hasChanges = function () {
        return !(
            angular.equals(self.telephonySettings, self.optionsGroupForm.telephony) &&
            angular.equals(self.userSettings, self.optionsGroupForm.user)
        );
    };

    /* -----  End of HELPERS  ------*/

    /*= ==============================
    =            ACTIONS            =
    ===============================*/

    self.changeSettings = function () {
        self.isChanging = true;
        return $q.all([
            Telephony.Lexi().edit({
                billingAccount: $stateParams.billingAccount
            }, _.pick(self.optionsGroupForm.telephony, telephonyAttributes)).$promise,
            User.Telephony().Settings().Lexi().change({
                settings: self.optionsGroupForm.user
            }).$promise
        ]).then(function () {
            self.telephonySettings = angular.copy(self.optionsGroupForm.telephony);
            self.userSettings = angular.copy(self.optionsGroupForm.user);
            Toast.success($translate.instant("telephony_billing_account_administration_options_group_success_changing"));
        }).catch(function (err) {
            Toast.error([$translate.instant("telephony_billing_account_administration_options_group_error_changing"), _.get(err, "data.message", "")].join(" "));
            return $q.reject(err);
        }).finally(function () {
            self.isChanging = false;
        });
    };

    self.cancelChange = function () {
        self.optionsGroupForm.telephony = angular.copy(self.telephonySettings);
        self.optionsGroupForm.user = angular.copy(self.userSettings);
    };

    /* -----  End of ACTIONS  ------*/

    /*= =====================================
    =            INITIALIZATION            =
    ======================================*/

    function init () {
        self.telephonySettings = null;
        self.userSettings = null;
        self.optionsGroupForm = {
            telephony: null,
            user: null
        };
        self.isLoading = true;
        return fetchSettings().then(function (settings) {
            self.telephonySettings = settings.telephony;
            self.userSettings = settings.user;
            self.optionsGroupForm.telephony = angular.copy(self.telephonySettings);
            self.optionsGroupForm.user = angular.copy(self.userSettings);
        }).catch(function (err) {
            Toast.error([$translate.instant("telephony_billing_account_administration_options_group_error_loading"), _.get(err, "data.message", "")].join(" "));
            return $q.reject(err);
        }).finally(function () {
            self.isLoading = false;
        });
    }

    /* -----  End of INITIALIZATION  ------*/

    init();
});
