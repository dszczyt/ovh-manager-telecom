angular.module("managerApp").factory("TelecomTelephonyLineCallsForwardPhoneNumber", function () {
    "use strict";

    /**
         * Phone number object
         * @param {Object} data properties
         */
    var TelecomTelephonyLineCallsForwardPhoneNumber = function TelecomTelephonyLineCallsForwardPhoneNumber (data) {
        _.extend(this, data);
        if (this.description === this.serviceName) {
            this.description = "";
        }
    };

    TelecomTelephonyLineCallsForwardPhoneNumber.prototype.toString = function () {
        return this.description ? this.description + ["(", ")"].join(this.serviceName) : this.serviceName;
    };

    Object.defineProperty(TelecomTelephonyLineCallsForwardPhoneNumber.prototype, "serviceName", {
        get: function () {
            return this.formatedNumber;
        },
        set: function (number) {
            if (number) {
                var matcher = number.match(/^(00(\d{1,3})|\+(\d{1,3})\s?\(0\))?([\d\s]*)$/);
                if (matcher && (matcher[2] || matcher[3]) && matcher[4]) {
                    this.formatedNumber = "00" + (matcher[3] || matcher[2]) + matcher[4].replace(/\s/g, "");// ("0033" + matcher[3] + matcher[4]).replace(/\s/g, "");
                } else {
                    this.formatedNumber = number;
                }
            } else {
                this.formatedNumber = number;
            }
        },
        enumerable: true
    });

    return TelecomTelephonyLineCallsForwardPhoneNumber;
}
);
