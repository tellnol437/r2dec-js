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
    function Condition(cmp, signed) {
        this.cmp = cmp;
        this.signed = signed;
        this.toString = function() {
            return '[Condition ' + [this.cmp, this.signed ? 'signed' : 'unsigned'].join(' ') + ']';
        };
    }

    return {
        OVERFLOW: new Condition('OF', true),
        NE: new Condition('NE', false),
        EQ: new Condition('EQ', false),
        LT_S: new Condition('LT', true),
        LE_S: new Condition('LE', true),
        GT_S: new Condition('GT', true),
        GE_S: new Condition('GE', true),
        LT_U: new Condition('LT', false),
        LE_U: new Condition('LE', false),
        GT_U: new Condition('GT', false),
        GE_U: new Condition('GE', false),
    };
})();