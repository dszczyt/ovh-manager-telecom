/**
 * Wrapper for ip-address library.
 * See doc here: http://ip-address.js.org/
 */
angular.module("managerApp").service("IpAddress", function ($window) {
    "use strict";

    /**
     * Returns a new instance of Address6.
     */
    this.address6 = function () {
        if ("Address6" in $window) {
            var Address6 = $window.Address6;
            var address = Object.create(Address6.prototype);
            Address6.apply(address, arguments);
            return address;
        }
        throw new Error("Missing ip-address dependency");

    };

    /**
     * Returns a new instance of Address4.
     */
    this.address4 = function () {
        if ("Address4" in $window) {
            var Address4 = $window.Address4;
            var address = Object.create(Address4.prototype);
            Address4.apply(address, arguments);
            return address;
        }
        throw new Error("Missing ip-address dependency");

    };

    /**
     * Shortcut method to test if a given ip string is a valid IPv4 or IPv6.
     */
    this.isValidIp = function (ip) {
        var addr = this.address4(ip);
        var valid = addr.isValid();
        if (!valid) {
            addr = this.address6(ip);
            valid = addr.isValid();
        }
        return valid;
    };

    this.isValidPublicIp4 = function (ip) {
        var addr = this.address4(ip);
        var valid = false;
        if (addr.isValid()) {
            var bytes = addr.toArray();
            valid = true;
            if (bytes[0] === 10) {
                valid = false;
            } else if (bytes[0] === 172 && bytes[1] >= 16 && bytes[1] <= 31) {
                valid = false;
            } else if (bytes[0] === 192 && bytes[1] === 168) {
                valid = false;
            }
        }
        return valid;
    };
});
