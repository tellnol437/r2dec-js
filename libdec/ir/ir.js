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

    function Opcode(location, name, operands) {
        this.location = location || Long.MAX_UNSIGNED_VALUE;
        this.name = name;
        this.operands = operands || [];
        this.toString = function() {
            return '[Opcode ' + [this.name].concat(this.operands).join(' ') + ']';
        };
        this.at = function(offset) {
            return (offset && offset != Long.MAX_UNSIGNED_VALUE) ? this.location.eq(offset) : false;
        };
    }

    function Illegal(location, operands) {
        Opcode.call(this, location, 'illegal', operands);
    }

    /*****************************************
     * Math operations
     *****************************************/

    function Increase(location, operands) {
        Opcode.call(this, location, '++', operands);
    }

    function Decrease(location, operands) {
        Opcode.call(this, location, '--', operands);
    }

    function Add(location, operands) {
        Opcode.call(this, location, '+', operands);
    }

    function Subtract(location, operands) {
        Opcode.call(this, location, '-', operands);
    }

    function Multiply(location, operands) {
        Opcode.call(this, location, '*', operands);
    }

    function Divide(location, operands) {
        Opcode.call(this, location, '/', operands);
    }

    function Module(location, operands) {
        Opcode.call(this, location, '%', operands);
    }

    function And(location, operands) {
        Opcode.call(this, location, '&', operands);
    }

    function Or(location, operands) {
        Opcode.call(this, location, '|', operands);
    }

    function Xor(location, operands) {
        Opcode.call(this, location, '^', operands);
    }

    function LeftShift(location, operands) {
        Opcode.call(this, location, '<<', operands);
    }

    function RightShift(location, operands) {
        Opcode.call(this, location, '>>', operands);
    }

    function LeftRotate(location, operands) {
        Opcode.call(this, location, 'rotl', operands);
    }

    function RightRotate(location, operands) {
        Opcode.call(this, location, 'rotr', operands);
    }

    function Negate(location, operands) {
        Opcode.call(this, location, '=-', operands);
    }

    function Not(location, operands) {
        Opcode.call(this, location, '=~', operands);
    }

    function Assign(location, operands) {
        Opcode.call(this, location, '=', operands);
    }

    function Swap(location, operands) {
        Opcode.call(this, location, 'swap', operands);
    }

    function BitMask(location, operands) {
        Opcode.call(this, location, 'swap', operands);
    }

    /*****************************************
     * Memory
     *****************************************/

    function Read(location, bits, operands) {
        Opcode.call(this, location, 'read', operands);
        this.bits = bits;
    }

    function Write(location, bits, operands) {
        Opcode.call(this, location, 'write', operands);
        this.bits = bits;
    }

    /*****************************************
     * Stack (Memory)
     *****************************************/

    function StackPush(location, operands) {
        Opcode.call(this, location, 'push', operands);
    }

    function StackPop(location, operands) {
        Opcode.call(this, location, 'pop', operands);
    }

    /*****************************************
     * Logic
     *****************************************/

    function Return(location, operands) {
        Opcode.call(this, location, 'return', operands);
    }

    function Jump(location, condition, operands) {
        if (condition) {
            operands.push(condition);
        }
        Opcode.call(this, location, condition ? 'cjump' : 'jump', operands);
    }

    Jump.is = function(opcode) {
        return opcode && opcode.name ? opcode.name.indexOf('jump') >= 0 : false;
    };

    function Compare(location, operands) {
        Opcode.call(this, location, 'cmp', operands);
    }

    /*****************************************
     * Signess
     *****************************************/

    // from unsigned to signed
    function ExtendSign(location, operands) {
        Opcode.call(this, location, 'extsign', operands);
    }

    // from signed to unsigned
    function ExtendZero(location, operands) {
        Opcode.call(this, location, 'extzero', operands);
    }

    return {
        /* math operations */
        Add: Add,
        And: And,
        Assign: Assign,
        BitMask: BitMask,
        Decrease: Decrease,
        Divide: Divide,
        Increase: Increase,
        LeftRotate: LeftRotate,
        LeftShift: LeftShift,
        Module: Module,
        Multiply: Multiply,
        Negate: Negate,
        Not: Not,
        Or: Or,
        RightRotate: RightRotate,
        RightShift: RightShift,
        Subtract: Subtract,
        Swap: Swap,
        Xor: Xor,
        /* memory */
        Read: Read,
        Write: Write,
        /* stack */
        StackPop: StackPop,
        StackPush: StackPush,
        /* logic */
        Compare: Compare,
        Jump: Jump,
        Return: Return,
        /* signess */
        ExtendSign: ExtendSign,
        ExtendZero: ExtendZero,
        /* everything else */
        Illegal: Illegal,
    };
})();