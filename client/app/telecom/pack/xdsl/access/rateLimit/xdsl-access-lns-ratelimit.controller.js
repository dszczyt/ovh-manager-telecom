angular.module("managerApp").controller("XdslAccessLnsRateLimitCtrl", function ($stateParams, $scope, $translate, Xdsl, ToastError) {
    "use strict";

    var self = this;

    function init () {
        self.step = 64;
        self.min = 64;
        self.max = 100032;
        self.default = self.max;
        self.doing = false;
        self.rate = {
            disabled: false,
            canApplyLnsRateLimit: false
        };
        self.undoRate = JSON.parse(JSON.stringify(self.rate));
        self.watcher = $scope.$watch("access.xdsl", function (data) {
            if (data) {
                self.rate = {
                    disabled: data.lnsRateLimit === null,
                    value: data.lnsRateLimit ? data.lnsRateLimit : self.default,
                    canApplyLnsRateLimit: data.capabilities.canApplyLnsRateLimit
                };
                self.undoRate = JSON.parse(JSON.stringify(self.rate));
                self.watcher();
            }
        });
    }

    self.reformatValue = function (value) {
        var matcher = ((value / 1024) + ".00").match(/^(\d*)\.(\d{2})/);
        if (matcher) {
            return matcher[1] + "." + matcher[2] + " Mbps";
        }
        return "";
    };

    self.valueChanged = function () {
        return (self.rate.disabled !== self.undoRate.disabled) || (self.rate.value !== self.undoRate.value);
    };

    self.changeRate = function () {
        if (self.rate.canApplyLnsRateLimit) {
            self.doing = true;
            Xdsl.Lexi().put(
                { xdslId: $stateParams.serviceName },
                { lnsRateLimit: self.rate.disabled ? null : self.rate.value },
                function () {
                    self.doing = false;
                    $scope.access.tasks.current.lnsApplyRateLimit = true;
                    self.undoRate = JSON.parse(JSON.stringify(self.rate));
                },
                function (err) {
                    self.doing = false;
                    self.rate = JSON.parse(JSON.stringify(self.undoRate));
                    return new ToastError(err);
                }
            );
        } else {
            self.rate = JSON.parse(JSON.stringify(self.undoRate));
        }
    };

    init();
});