angular.module("managerApp").controller(
    "TelecomTelephonyAbbreviatedNumbersCtrl",
    function ($q, $stateParams, $translate, Telephony, Toast, PAGINATION_PER_PAGE) {
        "use strict";

        var self = this;

        this.remove = function (abbreviatedNumber) {
            return Telephony.AbbreviatedNumber().Lexi().remove({
                billingAccount: $stateParams.billingAccount,
                abbreviatedNumber: abbreviatedNumber.abbreviatedNumber
            }).$promise;
        };

        this.insert = function (abbreviatedNumber) {
            return Telephony.AbbreviatedNumber().Lexi().insert({
                billingAccount: $stateParams.billingAccount,
                serviceName: $stateParams.serviceName
            }, abbreviatedNumber).$promise;
        };

        this.update = function (abbreviatedNumber) {
            return Telephony.AbbreviatedNumber().Lexi().update({
                billingAccount: $stateParams.billingAccount,
                serviceName: $stateParams.serviceName,
                abbreviatedNumber: abbreviatedNumber.abbreviatedNumber
            }, _.pick(abbreviatedNumber, ["destinationNumber", "name", "surname"])).$promise;
        };

        this.load = function () {
            this.loading = {
                init: true
            };
            this.abbreviatedNumbers = [];
            return Telephony.AbbreviatedNumber().Aapi().query({
                billingAccount: $stateParams.billingAccount
            }).$promise.then(
                function (abbreviatedNumbers) {
                    self.abbreviatedNumbers = _.sortBy(abbreviatedNumbers, "abbreviatedNumber");
                },
                function () {
                    Toast.error($translate.instant("telephony_abbreviated_numbers_read_error"));
                }
            ).finally(function () {
                delete self.loading.init;
            });
        };

        function init () {
            self.pattern = {
                regexp: /^7\d{2,3}$/,
                errorMessage: $translate.instant("telephony_abbreviated_numbers_pattern_error")
            };
            self.filter = {
                perPage: PAGINATION_PER_PAGE
            };

            return $q.all([
                Telephony.Lexi().get({ billingAccount: $stateParams.billingAccount }).$promise.then(
                    function (detail) {
                        self.exportFilename = "ab_num_" + (detail.description || $stateParams.billingAccount) + ".csv";
                    },
                    function () {
                        self.exportFilename = "ab_num_" + $stateParams.billingAccount + ".csv";
                    }
                ),
                self.load()
            ]);
        }

        init();
    }
);
