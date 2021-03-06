angular.module("managerApp").controller("voipTimeConditionSlotEditCtrl", function ($scope, $timeout, $filter, $q, TelephonyMediator) {
    "use strict";

    var self = this;

    self.loading = {
        init: false
    };

    self.popoverStatus = {
        move: false,
        rightPage: null
    };

    self.model = {
        slotType: null,
        search: ""
    };

    self.slot = null;
    self.availableSlotTypes = ["number_ovh", "number", "voicemail"];
    self.groups = null;
    self.redirectNumberOvh = null;

    /*= ==============================
    =            HELPERS            =
    ===============================*/

    self.getServiceType = function (service) {
        if (service.serviceType === "alias") {
            return "number";
        }
        if (!service.isFax && service.isTrunk && service.isTrunk()) {
            return "trunk";
        } else if (service.isFax) {
            return "fax";
        }
        return service.isPlugNFax ? "plug_fax" : "line";


    };

    self.filterGroupServices = function (group) {
        if (self.model.slotType === "number_ovh") {
            return group.getAllServices();
        }

        return [].concat(group.lines, group.fax);
    };

    self.filterDisplayedGroup = function (group) {
        return $filter("propsFilter")(self.filterGroupServices(group), {
            serviceName: self.model.search,
            description: self.model.search
        }).length;
    };

    self.isSlotValid = function () {
        return !_.isEmpty(self.slot.number);
    };

    /* -----  End of HELPERS  ------*/

    /*= =============================
    =            EVENTS            =
    ==============================*/

    /* ----------  SlotType actions  ----------*/

    self.onSlotTypeBtnClick = function () {
        self.popoverStatus.move = true;
        self.popoverStatus.rightPage = "slotType";
    };

    self.onSlotTypeChange = function () {
        self.popoverStatus.move = false;
        self.model.search = "";

        if (self.model.slotType === "number") {
            // reset number to let user type its external number
            self.slot.number = null;
            self.redirectNumberOvh = null;
        } else {
            if (self.model.slotType === "number_ovh") {
                self.slot.type = "number";
            } else {
                self.slot.type = "voicemail";
            }

            if (self.model.slotType === "voicemail" && self.redirectNumberOvh && self.redirectNumberOvh.serviceType !== "alias") {
                self.slot.number = self.redirectNumberOvh.serviceName;
                return;
            }

            var currentNumber = TelephonyMediator.findService(self.slot.serviceName);
            if (currentNumber) {
                self.redirectNumberOvh = currentNumber;
                self.slot.number = currentNumber.serviceName;
            } else {
                self.slot.number = null;
                self.redirectNumberOvh = null;
            }
        }
    };

    /* ----------  SlotNumber actions  ----------*/

    self.onSlotNumberBtnClick = function () {
        self.popoverStatus.move = true;
        self.popoverStatus.rightPage = "number";
    };

    self.onSlotNumberChange = function () {
        self.popoverStatus.move = false;

        // refresh ovh number
        self.redirectNumberOvh = TelephonyMediator.findService(self.slot.number);
    };

    /* ----------  Footer actions  ----------*/

    self.onValidateBtnClick = function () {
        self.slot.stopEdition();
    };

    self.onCancelBtnClick = function () {
        self.$onDestroy();
    };

    /* -----  End of EVENTS  ------*/

    /*= =====================================
    =            INITIALIZATION            =
    ======================================*/

    self.$onInit = function () {
        self.loading.init = true;

        return $q.allSettled([
            $timeout(angular.noop, 99), // use of timeout because button click that trigger popover is called after controller init
            TelephonyMediator.getAll()
        ]).then(function () {
            // set slot instance to edit
            self.slot = $scope.$parent.$ctrl.slot.startEdition();

            // set true slot type
            self.redirectNumberOvh = TelephonyMediator.findService(self.slot.number);
            if (self.slot.type === "number" && self.redirectNumberOvh) {
                self.model.slotType = "number_ovh";
            } else {
                self.model.slotType = self.slot.type;
            }

            // sort and filter groups and reject groups that don't have any service
            self.groups = _.chain(TelephonyMediator.groups).filter(function (group) {
                return group.getAllServices().length > 0;
            }).sortBy(function (group) {
                return group.getDisplayedName();
            }).value();
        }).finally(function () {
            self.loading.init = false;
        });
    };

    self.$onDestroy = function () {
        self.slot.stopEdition(true);
    };

    /* -----  End of INITIALIZATION  ------*/

});
