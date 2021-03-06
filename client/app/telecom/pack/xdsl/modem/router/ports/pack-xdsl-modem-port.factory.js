angular.module("managerApp").factory("PackXdslModemPortObject", function (Xdsl, $translate, Toast) {
    "use strict";

    var template = {
        protocol: "TCP",
        taskId: null,
        name: "",
        externalPortStart: null,
        externalPortEnd: null,
        description: "",
        internalClient: "",
        allowedRemoteIp: "",
        internalPort: null,
        id: null
    };

    /**
     * Object constructor
     * @param {Object} data Data from APIv6
     */
    var PackXdslModemPortObject = function (data) {
        _.extend(
            this,
            template,
            _.pick(
                data,
                Object.keys(template)
            )
        );
    };

    /**
     * Save a port redirection
     * @param {String} serviceName Name of the Xdsl service
     * @return {Promise}
     */
    PackXdslModemPortObject.prototype.save = function (serviceName) {
        var self = this;
        this.busy = true;
        if (this.id) {
            return Xdsl.Modem().Port().Lexi().update(
                {
                    xdslId: serviceName,
                    name: this.name
                },
                _.pick(_.pick(this.tempValue, Object.keys(template)), _.identity)
            ).$promise.then(function () {
                _.extend(self, self.tempValue);
                self.toggleEdit(false);
                Toast.success($translate.instant("xdsl_modem_ports_edit_success", { name: self.name }));
                return self;
            }).catch(function () {
                Toast.error($translate.instant("xdsl_modem_ports_edit_error", { name: self.name }));
            }).finally(function () {
                self.busy = false;
            });
        }
        return Xdsl.Modem().Port().Lexi().post(
            {
                xdslId: serviceName
            },
            _.pick(_.pick(this.tempValue, Object.keys(template)), _.identity)
        ).$promise.then(function (data) {
            _.extend(self, _.pick(data, Object.keys(template)));
            self.toggleEdit(false);
            Toast.success($translate.instant("xdsl_modem_ports_add_success", { name: self.name }));
            return self;
        }).catch(function () {
            Toast.error($translate.instant("xdsl_modem_ports_add_error", { name: self.name }));
        }).finally(function () {
            self.busy = false;
        });

    };

    /**
     * delete a port redirection
     * @param {String} serviceName Name of the Xdsl service
     * @return {Promise}
     */
    PackXdslModemPortObject.prototype.remove = function (serviceName) {
        var self = this;
        this.busy = true;
        return Xdsl.Modem().Port().Lexi().delete(
            {
                xdslId: serviceName,
                name: this.name
            }
        ).$promise.then(function () {
            Toast.success($translate.instant("xdsl_modem_ports_del_success", { name: self.name }));
            return self;
        }).catch(function () {
            Toast.error($translate.instant("xdsl_modem_ports_del_error", { name: self.name }));
        }).finally(function () {
            self.busy = false;
        });
    };

    /**
     * Cancel edit mode
     */
    PackXdslModemPortObject.prototype.cancel = function () {
        this.toggleEdit(false);
        return this.id;
    };

    /**
     * Enter Edit Mode
     */
    PackXdslModemPortObject.prototype.edit = function () {
        var fields = _.without(Object.keys(template), "taskId", "id");
        this.tempValue = _.pick(this, fields);
        this.toggleEdit(true);
    };

    /**
     * Toggle edit mode
     * @param {Boolean} state [Optional] if set, for the edit mode state
     * @return {Boolean} new edit mode state
     */
    PackXdslModemPortObject.prototype.toggleEdit = function (state) {
        if (_.isBoolean(state)) {
            this.editMode = state;
        } else {
            this.editMode = !this.editMode;
        }
        return this.editMode;
    };

    return PackXdslModemPortObject;
});
