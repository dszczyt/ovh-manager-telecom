angular.module("managerApp").controller("TelecomTelephonyLineAssistTroubleshootingCtrl", function ($anchorScroll, $timeout, $stateParams, troubleshootingProcess, TelephonyMediator, TELEPHONY_LINE_PHONE_ADDITIONAL_INFOS) {
    "use strict";

    var self = this;

    var commonSteps = {
        procedureStep: {
            name: "procedure",
            view: "@procedureStepView"
        },
        contactStep: {
            name: "contact",
            templateUrl: "app/telecom/telephony/line/assist/troubleshooting/contact/telecom-telephony-line-assist-troubleshooting-contact.html"
        },
        autoConfigStep: {
            name: "autoConfig",
            isFinalized: false,
            view: "@autoConfigStepView"
        }
    };

    self.loading = {
        init: false
    };

    self.process = troubleshootingProcess;
    self.imgScr = null;
    self.steps = [];

    /*= ==============================
    =            HELPERS            =
    ===============================*/

    function foundPhoneType () {
        if ((/^phone\.thomson/).test(self.process.line.phone.brand)) {
            return "thomson";
        } else if ((/^phone\.(siemens)/).test(self.process.line.phone.brand) || self.process.line.phone.brand === "phone.gigaset.c530ip") {
            return "siemens";
        } else if ((/^phone\.(gigaset)/).test(self.process.line.phone.brand)) {
            return "gigaset";
        } else if ((/^phone\.(linksys\.pap)/).test(self.process.line.phone.brand) || self.process.line.phone.brand === "phone.cisco.spa112") {
            return "linksys";
        } else if ((/^phone\.(cisco\.spa)/).test(self.process.line.phone.brand)) {
            return "cisco";
        } else if ((/^phone\.lg/).test(self.process.line.phone.brand)) {
            return "lg";
        } else if ((/^phone\.polycom/).test(self.process.line.phone.brand)) {
            return "polycom";
        } else if ((/^phone\.yealink/).test(self.process.line.phone.brand)) {
            return "yealink";
        } else if ((/^phone\.(unidata|incom)/).test(self.process.line.phone.brand)) {
            return "unidata";
        } else if ((/^phone\.joher/).test(self.process.line.phone.brand)) {
            return "popc";
        }
        return "unkown";
    }

    self.isCurrentStepLastStep = function () {
        return _.isEqual(self.process.activeStep.id, _.last(self.steps).id);
    };

    self.addStep = function (stepOptions) {
        var step = angular.extend({
            active: false,
            display: false,
            isFinalized: true,
            id: _.random(_.now())
        }, stepOptions);

        self.steps.push(step);

        return step;
    };

    /* -----  End of HELPERS  ------*/

    /*= ==============================
    =            ACTIONS            =
    ===============================*/

    self.refreshSteps = function (steps) {
        // reset steps
        self.steps = [];

        var problem = _.find(self.problemsList, {
            name: self.process.problem
        });

        // is there is no custom step to add, add common steps (procedure and contact support)
        var stepsToAdd = steps || problem.customSteps || [commonSteps.procedureStep, commonSteps.contactStep];

        angular.forEach(stepsToAdd, function (stepToAddOptionsParam, index) {
            var stepToAddOptions = stepToAddOptionsParam;
            if (index === 0) {
                stepToAddOptions = angular.extend({
                    active: true,
                    display: true
                }, stepToAddOptions);
            }
            self.addStep(stepToAddOptions);
        });

        self.process.activeStep = self.steps[0];
    };

    self.manageItWorks = function () {
        var activeStepIndex = _.findIndex(self.steps, {
            active: true
        });

        if (activeStepIndex === -1) {
            return;
        }

        // desactivate active step
        self.process.activeStep.active = false;

        // remove all steps from index...
        self.steps.splice(activeStepIndex + 1);

        // and insert success step
        self.process.activeStep = self.addStep({
            name: "success",
            active: true,
            display: true,
            templateUrl: "app/telecom/telephony/line/assist/troubleshooting/success/telecom-telephony-line-assist-troubleshooting-success.html"
        });
    };

    self.manageItStillDoesnttWork = function () {
        var activeStepIndex = _.findIndex(self.steps, {
            active: true
        });

        if (activeStepIndex === -1) {
            return;
        }

        // if it's not the final step, go to next step
        if (!self.isCurrentStepLastStep()) {
            // desactivate current step
            self.process.activeStep.active = false;

            // go to next step
            self.process.activeStep = self.steps[activeStepIndex + 1];
            self.process.activeStep.active = true;
            self.process.activeStep.display = true;
        }
    };

    /* -----  End of ACTIONS  ------*/

    /*= =====================================
    =            INITIALIZATION            =
    ======================================*/

    /* ----------  PROBLEM INIT  ----------*/

    function getCiscoProblems () {
        return [{
            name: "mute"
        }, {
            name: "network"
        }, {
            name: "led_orange",
            customSteps: [commonSteps.procedureStep, commonSteps.autoConfigStep, {
                name: "manualConfig",
                isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }, {
            name: "callin"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, {
                name: "manualConfig",
                isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }];
    }

    function getSiemensProblems () {
        if (self.process.line.phone.brand !== "phone.gigaset.c530ip") {
            return [{
                name: "callout"
            }, {
                name: "callin"
            }, {
                name: "blueButton"
            }, {
                name: "nobase"
            }, {
                name: "register",
                customSteps: [commonSteps.procedureStep, commonSteps.autoConfigStep, commonSteps.contactStep]
            }, {
                name: "phoneBookGigaset"
            }, {
                name: "softReinit",
                customSteps: [commonSteps.autoConfigStep, commonSteps.contactStep]
            }];
        }
        return [{
            name: "callout"
        }, {
            name: "callin"
        }, {
            name: "blueButton"
        }, {
            name: "nobase"
        }, {
            name: "register",
            customSteps: [commonSteps.procedureStep, commonSteps.autoConfigStep, {
                name: "manualConfig",

                // isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }, {
            name: "phoneBookGigaset"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, {
                name: "manualConfig",

                // isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }];

    }

    function getLinksysProblems () {
        return [{
            name: "nopower"
        }, {
            name: "line1off"
        }, {
            name: "line1onbutnocall"
        }, {
            name: "redlight"
        }, {
            name: "christmastree"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, {
                name: "manualConfig",
                isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }];
    }

    function getPolycomProblems () {
        return [{
            name: "power"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, commonSteps.contactStep]
        }];
    }

    function getGigasetProblems () {
        return [{
            name: "upgrade"
        }, {
            name: "callin"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, {
                name: "manualConfig",
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }];
    }

    function getLGProblems () {
        return [{
            name: "nonetwork"
        }, {
            name: "connection"
        }, {
            name: "forbidden"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, {
                name: "manualConfig",
                isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }];
    }

    function getThomsonProblems () {
        return [{
            name: "noip"
        }, {
            name: "local"
        }, {
            name: "softReinit",
            customSteps: [commonSteps.autoConfigStep, {
                name: "manualConfig",
                isFinalized: false,
                view: "@manualConfigStepView"
            }, commonSteps.contactStep]
        }];
    }

    function getPhoneTypeProblems () {
        switch (self.process.phoneType) {
        case "cisco":
            return getCiscoProblems();
        case "siemens":
            return getSiemensProblems();
        case "linksys":
            return getLinksysProblems();
        case "polycom":
            return getPolycomProblems();
        case "gigaset":
            return getGigasetProblems();
        case "lg":
            return getLGProblems();
        case "thomson":
            return getThomsonProblems();
        default:
            self.process.problem = "softReinit";
            var steps = [commonSteps.autoConfigStep, commonSteps.contactStep];
            self.refreshSteps(steps);
            return [{
                name: "softReinit",
                customSteps: steps
            }];
        }
    }

    /* ----------  INIT  ----------*/

    function init () {
        self.loading.init = true;

        return TelephonyMediator.getGroup($stateParams.billingAccount).then(function (group) {
            self.process.line = group.getLine($stateParams.serviceName);
            return self.process.line.getPhone();
        }).then(function () {
            // set phone type
            self.process.phoneType = foundPhoneType();

            // set phone image src
            self.imgScr = TELEPHONY_LINE_PHONE_ADDITIONAL_INFOS[self.process.line.phone.brand] ? TELEPHONY_LINE_PHONE_ADDITIONAL_INFOS[self.process.line.phone.brand].img : null;

            // set problem list
            self.problemsList = getPhoneTypeProblems();
        }).finally(function () {
            self.loading.init = false;
        });
    }

    /* -----  End of INITIALIZATION  ------*/

    init();

});
