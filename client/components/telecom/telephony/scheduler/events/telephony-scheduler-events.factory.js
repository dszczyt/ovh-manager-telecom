/**
 *  Describe a telephony scheduler event item.
 *
 *  @constructor
 *  @param  {Object} options Options for creating a new VoipSchedulerEvent.
 *  @param  {String} options.billingAccount Billing account of the scheduler event.
 *  @param  {String} options.categories Category of the scheduler event.
 *  @param  {String} options.dateEnd End date to UTC date string format.
 *  @param  {String} options.dateStart Starting date to UTC date string format.
 *  @param  {String} options.description Description of the scheduler event.
 *  @param  {String} options.serviceName Service name of the scheduler event.
 *  @param  {String} options.status Status of the event.
 *  @param  {String} options.title Title of the scheduler event.
 *  @param  {String} options.uid Unique id of the scheduler event.
 */
angular.module("managerApp").factory("VoipSchedulerEvent", function (Telephony, SCHEDULER_CATEGORY_TO_ICS_VEVENT_CATEGORY) {
    "use strict";

    var generateUid = function () {
        var random = _.sample("abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890", 8);
        return moment().format("YYYYMMDDhhmmss") + random.join("") + "@ovh.com";
    };

    /*= ==================================
    =            CONSTRUCTOR            =
    ===================================*/

    function VoipSchedulerEvent (optionsParam) {
        var options = optionsParam || {};

        // options check
        if (!options.billingAccount) {
            throw new Error("billingAccount option must be specified when creating a new VoipSchedulerEvent");
        }
        if (!options.serviceName) {
            throw new Error("serviceName option must be specified when creating a new VoipSchedulerEvent");
        }

        // mandatory
        this.billingAccount = options.billingAccount;
        this.serviceName = options.serviceName;

        // from api
        this.setOptions(options);

        // custom
        this.allDay = this.isFullDay();
        this.inEdition = false;
        this.status = options.status || "OK";
        this.saveForEdition = null;
        this.originalSave = null;
    }

    /* -----  End of CONSTRUCTOR  ------*/

    /*= ========================================
    =            PROTOTYPE METHODS            =
    =========================================*/

    /* ----------  HELPERS  ----------*/

    /**
     *  Bind API informations to scheduler event instance.
     *
     *  @param {Object} options New options of the scheduler event instance. See constructor for more details.
     *
     *  @return {VoipSchedulerEvent} The current scheduler event instance.
     */
    VoipSchedulerEvent.prototype.setOptions = function (options) {
        var self = this;

        if (!options) {
            return self;
        }

        self.dateStart = new Date(options.dateStart);
        self.title = options.title || "";
        self.dateEnd = new Date(options.dateEnd);
        self.categories = options.categories || "scheduler1";
        self.description = options.description || "";
        self.uid = options.uid || generateUid();

        return self;
    };

    /**
     *  Convert scheduler event instance to a event object compatible with full calendar lib.
     *
     *  @return {Object} A compatible full calendar object.
     */
    VoipSchedulerEvent.prototype.toFullCalendarEvent = function () {
        var self = this;

        return {
            id: self.uid,
            title: self.title,
            start: self.dateStart,
            end: self.dateEnd
        };
    };

    VoipSchedulerEvent.prototype.toIcsVEvent = function (schedulerTimeZone) {
        var self = this;

        var convertToVEventEntry = function (entryParam, attribute) {
            var entry = entryParam;
            var attributeValue;

            switch (attribute) {
            case "categories":
                attributeValue = SCHEDULER_CATEGORY_TO_ICS_VEVENT_CATEGORY[_.get(self, attribute)];
                break;
            case "dateEnd":
            case "dateStart":
                entry = entry + ";TZID=" + schedulerTimeZone;
                attributeValue = moment(_.get(self, attribute)).format("YYYYMMDDTHHmmss");
                break;
            default:
                attributeValue = _.get(self, attribute);
                break;
            }

            return [entry, attributeValue].join(":");
        };

        return [
            "BEGIN:VEVENT",
            convertToVEventEntry("SUMMARY", "title"),
            "LAST-MODIFIED:",
            convertToVEventEntry("UID", "uid"),
            convertToVEventEntry("CATEGORIES", "categories"),
            convertToVEventEntry("DTEND", "dateEnd"),
            "CREATED:",
            convertToVEventEntry("DTSTART", "dateStart"),
            convertToVEventEntry("DESCRIPTION", "description"),
            "END:VEVENT"
        ].join("\n");
    };

    /**
     *  Check if the scheduler event is full day long.
     *
     *  @return {Boolean} True if duration between begin and end dates is bigger or equal to 1 day.
     */
    VoipSchedulerEvent.prototype.isFullDay = function () {
        var self = this;
        var momentEndDate = moment(self.dateEnd);
        var momentStartDate = moment(self.dateStart);

        var durationCheck = function (duration) {
            return duration.get("days") >= 1 && duration.get("hours") === 0 && duration.get("minutes") === 0 && duration.get("months") === 0 && duration.get("seconds") === 0 && duration.get("years") === 0;
        };

        // we consider full day if difference between start and end date is bigger or equal to one day or if when adding 1 second to end date difference is bigger or equal to one day.
        return durationCheck(moment.duration(momentEndDate.diff(momentStartDate))) || durationCheck(moment.duration(momentEndDate.add(1, "seconds").diff(momentStartDate)));
    };

    /* ----------  API CALLS  ----------*/

    /**
     *  Save the current instance of scheduler event options. Call to PUT /telephony/{billingAccount}/scheduler/{serviceName}/events/{uid} API.
     *
     *  @return {Promise} That returns the current instance of scheduler event if resolved.
     */
    VoipSchedulerEvent.prototype.save = function () {
        var self = this;

        return Telephony.Scheduler().Events().Lexi().save({
            billingAccount: self.billingAccount,
            serviceName: self.serviceName,
            uid: self.uid
        }, {
            categories: self.categories,
            dateEnd: moment(self.dateEnd).format(),
            dateStart: moment(self.dateStart).format(),
            description: self.description,
            title: self.title
        }).$promise.then(function () {
            return self;
        });
    };

    /**
     *  Create an new scheduler event with current instance options. Call to POST /telephony/{billingAccount}/scheduler/{serviceName}/events API.
     *
     *  @return {Promise} That returns the current instance of scheduler event if resolved.
     */
    VoipSchedulerEvent.prototype.create = function () {
        var self = this;

        return Telephony.Scheduler().Events().Lexi().create({
            billingAccount: self.billingAccount,
            serviceName: self.serviceName
        }, {
            category: self.categories,
            dateEnd: moment(self.dateEnd).format(),
            dateStart: moment(self.dateStart).format(),
            description: self.description,
            title: self.title,
            uid: self.uid
        }).$promise.then(function () {
            return self;
        });
    };

    /**
     *  Delete the current instance of scheduler instance. Call to DELETE /telephony/{billingAccount}/scheduler/{serviceName}/events/{uid} API.
     *
     *  @return {Promise} That returns the current instance of scheduler event if resolved.
     */
    VoipSchedulerEvent.prototype.remove = function () {
        var self = this;

        return Telephony.Scheduler().Events().Lexi().remove({
            billingAccount: self.billingAccount,
            serviceName: self.serviceName,
            uid: self.uid
        }).$promise.then(function () {
            return self;
        });
    };

    /* ----------  EDITION  ----------*/

    /**
     *  Start scheduler event edition. Copy the current options into a temp object.
     *
     *  @return {VoipSchedulerEvent} The current scheduler event instance.
     */
    VoipSchedulerEvent.prototype.startEdition = function () {
        var self = this;

        if (self.inEdition) {
            return self;
        }

        self.inEdition = true;

        self.saveForEdition = {
            dateStart: angular.copy(self.dateStart),
            title: angular.copy(self.title),
            dateEnd: angular.copy(self.dateEnd),
            categories: angular.copy(self.categories),
            description: angular.copy(self.description),
            allDay: angular.copy(self.allDay)
        };

        if (_.isNull(self.originalSave)) {
            self.originalSave = angular.copy(self.saveForEdition);
        }

        return self;
    };

    /**
     *  Stop scheduler event edition. Reset copied scheduler options.
     *
     *  @param  {Boolean} rollbackSaveForEdition Flag telling to reset or not scheduler event attributes to old values.
     *
     *  @return {VoipSchedulerEvent} The current scheduler event instance.
     */
    VoipSchedulerEvent.prototype.stopEdition = function (rollbackSaveForEdition, rollbackOriginalSave) {
        var self = this;

        if (self.originalSave && rollbackOriginalSave) {
            self.dateStart = angular.copy(self.originalSave.dateStart);
            self.title = angular.copy(self.originalSave.title);
            self.dateEnd = angular.copy(self.originalSave.dateEnd);
            self.categories = angular.copy(self.originalSave.categories);
            self.description = angular.copy(self.originalSave.description);
            self.allDay = angular.copy(self.originalSave.allDay);

            self.resetOriginalSave();
        } else if (self.saveForEdition && rollbackSaveForEdition) {
            self.dateStart = angular.copy(self.saveForEdition.dateStart);
            self.title = angular.copy(self.saveForEdition.title);
            self.dateEnd = angular.copy(self.saveForEdition.dateEnd);
            self.categories = angular.copy(self.saveForEdition.categories);
            self.description = angular.copy(self.saveForEdition.description);
            self.allDay = angular.copy(self.saveForEdition.allDay);
        }

        self.saveForEdition = null;
        self.inEdition = false;

        return self;
    };

    /**
     *  Revert original save informations.
     *
     *  @return {VoipSchedulerEvent} Current instance of scheduler event.
     */
    VoipSchedulerEvent.prototype.resetOriginalSave = function () {
        var self = this;

        self.originalSave = null;

        return self;
    };

    /**
     *  Check if changes have been made to scheduler event instance.
     *
     *  @param  {String}  property Property to check for change. If not defined, check the hole scheduler event instance properties.
     *
     *  @return {Boolean}   true if at least one change has been found, false if no changes.
     */
    VoipSchedulerEvent.prototype.hasChange = function (property, fromOriginal) {
        var self = this;

        if (fromOriginal && !self.originalSave) {
            return false;
        } else if (!fromOriginal && !self.saveForEdition) {
            return false;
        }

        if (property) {
            return !_.isEqual(self[property], fromOriginal ? self.originalSave[property] : self.saveForEdition[property]);
        }
        return ["CREATING", "TODELETE"].indexOf(self.status) > -1 ||
                    self.hasChange("dateStart", fromOriginal) ||
                    self.hasChange("title", fromOriginal) ||
                    self.hasChange("dateEnd", fromOriginal) ||
                    self.hasChange("categories", fromOriginal) ||
                    self.hasChange("description", fromOriginal);
    };

    /* -----  End of PROTOTYPE METHODS  ------*/

    return VoipSchedulerEvent;

});
