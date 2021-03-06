angular.module("managerApp").controller("XdslAccessCtrl", function ($scope, $stateParams, $uibModal, $q, $filter, $translate, $templateCache, Xdsl, XdslTasksCurrent, XdslAvailableLns, XdslLines, XdslNotifications, XdslModem, XdslIps,
                                                                    PackXdsl, ToastError, PACK_IP, REDIRECT_URLS) {
    "use strict";

    var self = this;

    this.packName = $stateParams.packName;

    $scope.loaders = {
        details: true,
        tasks: true,
        deconsolidation: true,
        xdsl: true
    };

    $scope.access = {
        xdsl: null,
        tasks: { current: {} }
    };

    $scope.constants = {
        rangeOfBaseIpv4IP: PACK_IP.baseIpv4Range
    };

    function init () {
        self.number = $stateParams.number;
        self.getLinesDetails();

        /* eslint-disable max-len */
        $templateCache.put("pack-xdsl-access-tooltip-mac.html", "<div class=\"tooltip-description\" data-translate=\"xdsl_details_mac_address_description\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-dslam.html", "<div class=\"tooltip-description\" data-translate=\"xdsl_access_dslam_reset_description\"></div><div class=\"text-warning\" data-translate=\"xdsl_access_dslam_reset_warning\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-lnsApply.html", "<div class=\"tooltip-description\" data-translate=\"xdsl_access_lns_ratelimit_description\"></div><div class=\"text-warning\" data-translate=\"xdsl_access_lns_ratelimit_warning\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-lns.html", "<div class=\"tooltip-description\" data-translate=\"xdsl_access_lns_description\"></div><div class=\"text-warning\" data-translate=\"xdsl_access_lns_warning\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-deconsolidation.html", "<div class=\"tooltip-description\" data-ng-bind=\" ('xdsl_access_deconsolidation_warning_' + XdslAccess.lineDetails.deconsolidation) | translate\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-ipDelete.html", "<div class=\"tooltip-description\" data-translate=\"xdsl_details_ips_remove_only_extra\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-ips.html", "<div class=\"tooltip-description\" data-translate=\"xdsl_access_ipv6_description\"></div><div class=\"text-warning\" data-translate=\"xdsl_access_ipv6_warning\"></div>");
        $templateCache.put("pack-xdsl-access-tooltip-dslamProfile.html", "<div class=\"text-left\"><p data-translate=\"xdsl_access_profile_tooltip_interleaved\"></p><p data-translate=\"xdsl_access_profile_tooltip_fast\"></p><p data-translate=\"xdsl_access_profile_tooltip_ginp\"></p><p data-translate=\"xdsl_access_profile_tooltip_auto\"></p><p data-translate=\"xdsl_access_profile_tooltip_snr\"></p><p class=\"text-warning\" data-translate=\"xdsl_access_profile_tooltip_time\"></p></div>");
        /* eslint-enable max-len */
    }

    function setStatusLabel (status) {
        switch (status) {
        case "active":
            self.statusLabel = "<i class=\"ovh-font ovh-font-success text-success fs16 right-space-m8\"></i> " + $translate.instant("xdsl_details_status_" + status);
            break;
        case "doing":
        case "migration":
        case "upgradeOffer":
            self.statusLabel = "<i class=\"ovh-font ovh-font-success text-success fs16 right-space-m8\"></i> " + $translate.instant("xdsl_details_status_" + status);
            break;
        case "cancelled":
        case "close":
        case "deleting":
        case "slamming":
            self.statusLabel = "<i class=\"ovh-font ovh-font-failure text-danger fs16 right-space-m8\"></i> " + $translate.instant("xdsl_details_status_" + status);
            break;
        default :
            self.statusLabel = status;
        }
    }

    function error (err) {
        if (!_.isEmpty(err)) {
            ToastError(err);
        }
        $scope.loaders.tasks = false;
    }

    function success (result) {
        if (result.success) {
            if ($scope.access.tasks.current.pendingOrderAdditionalIpOption && !result.data.pendingOrderAdditionalIpOption) {
                self.getIps();
                self.ordering = false;
            }
            $scope.access.tasks.current = result.data;
        } else {
            error(result);
        }
        $scope.loaders.tasks = false;
    }

    function pollTasks () {
        XdslTasksCurrent.Aapi().poll($scope, {
            xdslId: $stateParams.serviceName
        }).then(
            success,
            error,
            success
        );
    }

    this.getOldV6TransfertUrl = function () {
        return REDIRECT_URLS.oldV6ServiceTransfert;
    };

    this.getIps = function () {
        return XdslIps.Aapi().ips({
            xdslId: $stateParams.serviceName
        }).$promise.then(function (ips) {
            self.ips = ips;
            self.ipsV6 = $filter("filter")(ips, { version: "v6" });
            self.ipsV4 = $filter("filter")(ips, { version: "v4" });
            ips.forEach(function (ip) {
                ip.getBlock = function () {
                    return this.ip + "/" + this.range;
                };
            });
        }, ToastError);
    };

    this.canOrderIps = function () {
        return _.filter(self.ipsV4, function (ip) {
            return ip.range !== PACK_IP.baseIpv4Range;
        }).length === 0;
    };

    this.orderIps = function () {
        var modal = $uibModal.open({
            animation: true,
            templateUrl: "app/telecom/pack/xdsl/access/ip/order/pack-xdsl-access-ip-order.modal.html",
            controller: "XdslAccessIpOrderCtrl",
            controllerAs: "ctrl",
            resolve: {
                data: function () {
                    return {
                        xdslId: $stateParams.serviceName
                    };
                }
            }
        });
        modal.result.then(function (result) {
            $scope.access.tasks.current[result.function] = true;
        });
    };

    this.deleteIps = function (ip) {
        ip.deleting = true;
        XdslIps.Lexi().unOrder({
            xdslId: $stateParams.serviceName,
            ip: ip.ip
        }, null).$promise.then(function () {
            self.getIps();
            ip.deleting = false;
        }, function (err) {
            ip.deleting = false;
            ToastError(err);
        });

    };

    $scope.notificationsChanged = function (elements) {
        if ($scope.access) {
            $scope.access.notificationsCount = elements.length;
        }
    };

    this.getLinesDetails = function () {

        $scope.loaders.details = true;
        $scope.loaders.tasks = true;

        self.transfert = {};

        pollTasks();

        $q.allSettled(
            [
                // Get access Details
                Xdsl.Lexi().get({
                    xdslId: $stateParams.serviceName
                }).$promise.then(function (access) {
                    $scope.loaders.xdsl = false;
                    $scope.access.xdsl = access;
                    setStatusLabel($scope.access.xdsl.status);

                    if ($scope.access.xdsl.capabilities.canChangeLns) {
                        return XdslAvailableLns.Lexi().query({
                            xdslId: $stateParams.serviceName
                        }).$promise.then(function (availableLns) {
                            if (!_.isEmpty(availableLns)) {
                                $scope.access.xdsl.hasLns = true;
                            }
                            $scope.access.xdsl.lns = availableLns;
                            return $scope.access.xdsl;
                        });
                    }
                    return $scope.access.xdsl;


                }, function (err) {
                    $scope.loaders.xdsl = false;
                    return new ToastError(err);
                }),

                // Get line details
                XdslLines.Lexi().get({
                    xdslId: $stateParams.serviceName,
                    number: $stateParams.number
                }).$promise.then(function (lineDetails) {
                    self.lineDetails = lineDetails;
                    $scope.deconsolidation = lineDetails.deconsolidation;
                    $scope.loaders.deconsolidation = false;
                }, function (err) {
                    $scope.loaders.deconsolidation = false;
                    return new ToastError(err);
                }),

                // Get MAC Address
                XdslModem.Lexi().get(
                    {
                        xdslId: $stateParams.serviceName
                    }
                ).$promise.then(
                    function (modemDetail) {
                        self.modem = modemDetail;
                    }, function (err) {
                        if (err.status === 404) {
                            return;
                        }
                        ToastError(err);
                    }
                ),

                self.getIps(),

                // Get notification number
                XdslNotifications.Lexi().query({
                    xdslId: $stateParams.serviceName
                }).$promise.then(function (ids) {
                    $scope.access.notificationsCount = ids.length;
                }, ToastError),

                // Get Order
                Xdsl.Lexi().getOrder({
                    xdslId: $stateParams.serviceName
                }).$promise.then(function (orders) {
                    self.actualOrder = _.find(orders, function (order) {
                        return order.status === "doing";
                    });

                    if (!self.actualOrder) {
                        self.actualOrder = _.findLast(orders, function (order) {
                            return order.status === "done";
                        });
                    }

                    if (self.actualOrder.doneDate) {
                        self.actualOrder.doneDateLocale = new Date(self.actualOrder.doneDate).toLocaleString();
                    }
                }, ToastError),

                PackXdsl.Task().Lexi().query({
                    packName: self.packName,
                    "function": "pendingAddressMove"
                }).$promise.then(function (result) {
                    self.pendingAddressMove = result.length > 0;
                })

            ]).finally(function () {
                $scope.loaders.details = false;
            });
    };

    $scope.$on("changeAccessNameEvent", function (event, data) {
        if ($scope.access.xdsl.accessName === data.xdslId) {
            $scope.access.xdsl.description = data.description;
        }
    });

    init();
});
