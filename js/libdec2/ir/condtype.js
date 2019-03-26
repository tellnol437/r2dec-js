/* 
 * Copyright (C) 2019 deroad
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = (function() {
    const Throw = require('libdec2/throw');

    /**
     * CondType.
     * @param {!String} type  Condition type
     * @constructor
     */
    function CondType(type) {
        Throw.isNotType(type, "string", CondType);

        /** @type {!String} */
        this.type = type;
    }

    /**
     * Returns true if the given object is CondType type
     * @param  {Object}  obj Any object
     * @return {Boolean}
     */
    CondType.is = function(obj) {
        return obj instanceof CondType;
    };

    /**
     * Returns true if the given object is a CondType
     * @param  {Object}  obj Any object
     * @return {Boolean}
     */
    CondType.prototype.eq = function(obj) {
        return CondType.is(obj) && this.name == obj.name;
    };

    /**
     * returns a string
     * @return {String}
     */
    CondType.prototype.toString = function() {
        return "[Cond " + this.type + "]";
    };

    CondType.ALWAYS = new CondType('ALWAYS');
    CondType.NE = new CondType('NE');
    CondType.EQ = new CondType('EQ');
    CondType.GT_U = new CondType('GT_U');
    CondType.GE_U = new CondType('GE_U');
    CondType.LT_U = new CondType('LT_U');
    CondType.LE_U = new CondType('LE_U');
    CondType.GE_S = new CondType('GE_S');
    CondType.LE_S = new CondType('LE_S');
    CondType.GT_S = new CondType('GT_S');
    CondType.LT_S = new CondType('LT_S');

    return CondType;
})();