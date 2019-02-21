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
    const Long = require('libdec/long');
    const Throw = require('libdec/throw');

    const OpTypes = {
        INVALID: "?",
        REGISTER: "reg",
        IMMEDIATE: "imm",
    };

    var _temp_counter = 0;

    function _new_temp() {
        _temp_counter++;
        return 'temp' + _temp_counter;
    }

    function Operand(value, size, type) {
        this.value = value || null;
        this.size = size || 0;
        this.type = type || OpTypes.INVALID;
        this.toString = function() {
            return '[Operand ' + [this.type, this.size, this.value].join(' ') + ']';
        };
        this.is = function(operand) {
            return this.type == operand.type;
        };
    }

    function Register(name, size) {
        Throw.IsNull(name, 'Register.name');
        Throw.IsNull(size, 'Register.size');
        Operand.call(this, name, size, OpTypes.REGISTER);
    }

    function Immediate(value, size) {
        Throw.IsNull(value, 'Immediate.value');
        Throw.IsNull(size, 'Immediate.size');
        if (typeof value == 'string') {
            value = Long.fromString(value, false, value.startsWith('0x') ? 16 : 10);
        }
        Operand.call(this, value, size, OpTypes.IMMEDIATE);
    }

    function TempRegister(size) {
        Throw.IsNull(size, 'TempRegister.size');
        Operand.call(this, _new_temp(), size, OpTypes.REGISTER);
    }

    function Unknown(value, size) {
        Operand.call(this, value);
    }

    return {
        Register: Register,
        Immediate: Immediate,
        TempRegister: TempRegister,
        Unknown: Unknown
    };
})();