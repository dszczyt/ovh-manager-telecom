angular.module("managerApp").controller("TelecomTelephonyLinePhonePhonebookContactAddCtrl", function ($q, $stateParams, $timeout, $uibModalInstance, TelephonyMediator, Telephony, Phonebookcontact, data) {
    "use strict";

    var self = this;

    /*= ==============================
    =            HELPERS            =
    ===============================*/

    self.isValidNumber = function (value) {
        return !_.isEmpty(value) ? TelephonyMediator.IsValidNumber(value) : true;
    };

    /* -----  End of HELPERS  ------*/

    /*= ==============================
    =            EVENTS            =
    ===============================*/

    self.handleContactPhoneNumber = function () {
        return Phonebookcontact.hasAtLeastOnePhoneNumber(self.phonecontactForm);
    };

    /* -----  End of EVENTS  ------*/

    /*= ==============================
    =            ACTIONS            =
    ===============================*/

    self.setGroup = function ($event, group) {
        $event.preventDefault();
        self.phonecontactForm.group = group;
    };

    self.add = function () {
        self.phonecontactForm.isAdding = true;
        return $q.all([
            Telephony.Line().Phone().Phonebook().PhonebookContact().Lexi().create({
                billingAccount: $stateParams.billingAccount,
                serviceName: $stateParams.serviceName,
                bookKey: self.phonebook.bookKey
            }, Phonebookcontact.getContactData(self.phonecontactForm)).$promise,
            $timeout(angular.noop, 1000)
        ]).then(function () {
            self.phonecontactForm.isAdding = false;
            self.phonecontactForm.hasBeenAdded = true;
            return $timeout(self.close, 1500);
        }, function (error) {
            return self.cancel({
                type: "API",
                msg: error
            });
        });
    };

    self.cancel = function (message) {
        return $uibModalInstance.dismiss(message);
    };

    self.close = function () {
        return $uibModalInstance.close(true);
    };

    /* -----  End of ACTIONS  ------*/

    /*= =====================================
    =            INITIALIZATION            =
    ======================================*/

    function init () {
        self.phonebook = angular.copy(data.phonebook);
        self.groupsAvailable = angular.copy(data.groupsAvailable);
        self.phonecontactForm = {
            name: null,
            surname: null,
            group: null,
            homePhone: null,
            homeMobile: null,
            workPhone: null,
            workMobile: null,
            isAdding: false,
            hasBeenAdded: false
        };
    }

    /* -----  End of INITIALIZATION  ------*/

    init();
});
