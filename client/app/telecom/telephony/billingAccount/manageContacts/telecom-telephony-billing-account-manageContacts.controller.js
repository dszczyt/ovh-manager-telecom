angular.module("managerApp").controller("TelecomTelephonyBillingAccountManageContactsCtrl", function ($stateParams, $q, $translate, Telephony, User, TelephonyMediator, PackXdslVoipLine, Toast, ToastError) {
    "use strict";

    var self = this;

    var contactAttributes = ["contactAdmin", "contactBilling", "contactTech"];

    function getGroupContacts () {
        return Telephony.Lexi().getServiceInfos({
            billingAccount: $stateParams.billingAccount
        }).$promise.then(function (result) {
            return [{
                value: _.pick(result, contactAttributes),
                modified: _.pick(result, contactAttributes),
                serviceName: $stateParams.billingAccount,
                serviceType: "group"
            }];
        });
    }

    function getPackXdslServiceIds () {
        return PackXdslVoipLine.Erika().services().aggregate("packName").execute().$promise.then(function (ids) {
            return _.pluck(ids, "key");
        });
    }

    function getLinesContacts () {
        return Telephony.Line().Lexi().query({
            billingAccount: $stateParams.billingAccount
        }).$promise.then(function (ids) {
            return $q.all(_.map(ids, function (id) {
                return Telephony.Lines().Lexi().getServiceInfos({
                    serviceName: id
                }).$promise.then(function (infos) {
                    return {
                        value: _.pick(infos, contactAttributes),
                        modified: _.pick(infos, contactAttributes),
                        serviceName: id,
                        serviceType: "line"
                    };
                }).catch(function (err) {
                    // if serviceInfos does not exist, service might be a sip trunk
                    if (err.status === 404) {
                        return Telephony.Trunks().Lexi().getServiceInfos({
                            serviceName: id
                        }).$promise.then(function (infos) {
                            return {
                                value: _.pick(infos, contactAttributes),
                                modified: _.pick(infos, contactAttributes),
                                serviceName: id,
                                serviceType: "trunk"
                            };
                        });
                    }
                    return $q.reject(err);

                });
            }));
        });
    }

    function getAliasContacts () {
        return Telephony.Number().Lexi().query({
            billingAccount: $stateParams.billingAccount
        }).$promise.then(function (ids) {
            return $q.all(_.map(ids, function (id) {
                return Telephony.Aliases().Lexi().getServiceInfos({
                    serviceName: id
                }).$promise.then(function (infos) {
                    return {
                        value: _.pick(infos, contactAttributes),
                        modified: _.pick(infos, contactAttributes),
                        serviceName: id,
                        serviceType: "alias"
                    };
                });
            }));
        });
    }

    function getPendingTasks () {
        return User.Task().ContactChange().Lexi().query().$promise.then(function (ids) {
            return $q.all(_.map(_.chunk(ids, 50), function (chunkIds) {
                return User.Task().ContactChange().Lexi().getBatch({
                    id: chunkIds
                }).$promise;
            })).then(function (chunkResult) {
                return _.pluck(_.flatten(chunkResult), "value");
            });
        });
    }

    function associatePendingTasks (tasks) {
        var rows = _.flatten(_.values(self.section));
        _.each(tasks, function (task) {
            if (["checkValidity", "doing", "todo", "validatingByCustomers"].indexOf(task.state) >= 0) {
                _.each(rows, function (row) {
                    if (row.serviceName === task.serviceDomain ||
                        (row.serviceType === "group" && task.serviceDomain === $stateParams.billingAccount)) {
                        row.pendingTask = task;
                    }
                });
            }
        });
    }

    function checkModifiableServices (services) {
        return getPackXdslServiceIds().then(function (idsToFilter) {
            _.each(services, function (service) {
                if (service.serviceType === "group" && _.startsWith(service.serviceName, "ovhtel-")) {
                    service.isModifiable = false;
                } else if (service.serviceType !== "group" && idsToFilter.indexOf(service.serviceName) >= 0) {
                    service.isModifiable = false;
                } else {
                    service.isModifiable = true;
                }
            });
        });
    }

    function init () {
        self.isLoading = true;
        return $q.all({
            billingAccount: TelephonyMediator.getGroup($stateParams.billingAccount),
            tasks: getPendingTasks(),
            group: getGroupContacts(),
            lines: getLinesContacts(),
            aliases: getAliasContacts()
        }).then(function (result) {
            self.sections = [];
            if (result.group.length) {
                self.sections.push("group");
            }
            if (result.lines.length) {
                self.sections.push("lines");
            }
            if (result.aliases.length) {
                self.sections.push("alias");
            }
            self.section = {
                group: result.group,
                lines: result.lines,
                alias: result.aliases
            };
            self.billingAccount = result.billingAccount;
            associatePendingTasks(result.tasks);
            return checkModifiableServices(result.group.concat(result.lines).concat(result.aliases));
        }).catch(function (err) {
            return new ToastError(err);
        }).finally(function () {
            self.isLoading = false;
        });
    }

    self.editContact = function (contact) {
        contact.editing = true;
        self.isEditing = true;
    };

    self.cancelEdition = function (contact) {
        contact.editing = false;
        self.isEditing = false;
        contact.modified = angular.copy(contact.value);
    };

    self.hasChanges = function (contact) {
        return !angular.equals(contact.value, contact.modified);
    };

    self.isContactValid = function (contact) {
        var isValid = true;
        var pattern = /^[^\s]+$/;
        _.each(_.values(contact.modified), function (value) {
            isValid = isValid && angular.isString(value) && pattern.test(value);
        });
        return isValid;
    };

    self.submitChanges = function (contact) {
        var promise = $q.reject("Unknown service type");
        contact.submiting = true;
        switch (contact.serviceType) {
        case "group":
            promise = Telephony.Lexi().changeContact({
                billingAccount: $stateParams.billingAccount
            }, _.pick(contact.modified, contactAttributes)).$promise;
            break;
        case "line":
            promise = Telephony.Lines().Lexi().changeContact({
                serviceName: contact.serviceName
            }, _.pick(contact.modified, contactAttributes)).$promise;
            break;
        case "trunk":
            promise = Telephony.Trunks().Lexi().changeContact({
                serviceName: contact.serviceName
            }, _.pick(contact.modified, contactAttributes)).$promise;
            break;
        case "alias":
            promise = Telephony.Aliases().Lexi().changeContact({
                serviceName: contact.serviceName
            }, _.pick(contact.modified, contactAttributes)).$promise;
            break;
        default:
            break;
        }
        return promise.then(function () {
            return getPendingTasks();
        }).then(function (tasks) {
            contact.value = angular.copy(contact.modified);
            contact.editing = false;
            self.isEditing = false;
            associatePendingTasks(tasks);
            Toast.success($translate.instant("telephony_group_manage_contacts_change_success"));
        }).catch(function (err) {
            return new ToastError(err);
        }).finally(function () {
            contact.submiting = false;
        });
    };

    init();
});
