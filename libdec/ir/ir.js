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
    function Opcode(name, operands) {
        this.name = name;
        this.operands = operands || [];
        this.toString = function() {
            return '[Opcode ' + [this.name].concat(this.operands).join(' ') + ']';
        };
    }

    function Illegal(operands) {
        Opcode.call(this, 'illegal', operands);
    }

    /*****************************************
     * Math operations
     *****************************************/

    function Increase(operands) {
        Opcode.call(this, '++', operands);
    }

    function Decrease(operands) {
        Opcode.call(this, '--', operands);
    }

    function Add(operands) {
        Opcode.call(this, '+', operands);
    }

    function Subtract(operands) {
        Opcode.call(this, '-', operands);
    }

    function Multiply(operands) {
        Opcode.call(this, '*', operands);
    }

    function Divide(operands) {
        Opcode.call(this, '/', operands);
    }

    function Module(operands) {
        Opcode.call(this, '%', operands);
    }

    function And(operands) {
        Opcode.call(this, '&', operands);
    }

    function Or(operands) {
        Opcode.call(this, '|', operands);
    }

    function Xor(operands) {
        Opcode.call(this, '^', operands);
    }

    function LeftShift(operands) {
        Opcode.call(this, '<<', operands);
    }

    function RightShift(operands) {
        Opcode.call(this, '>>', operands);
    }

    function LeftRotate(operands) {
        Opcode.call(this, 'rotl', operands);
    }

    function RightRotate(operands) {
        Opcode.call(this, 'rotr', operands);
    }

    function Negate(operands) {
        Opcode.call(this, '=-', operands);
    }

    function Not(operands) {
        Opcode.call(this, '=~', operands);
    }

    function Assign(operands) {
        Opcode.call(this, '=', operands);
    }

    function Swap(operands) {
        Opcode.call(this, 'swap', operands);
    }

    function BitMask(operands) {
        Opcode.call(this, 'swap', operands);
    }

    /*****************************************
     * Memory
     *****************************************/

    function Read(bits, operands) {
        Opcode.call(this, 'read', operands);
        this.bits = bits;
    }

    function Write(bits, operands) {
        Opcode.call(this, 'write', operands);
        this.bits = bits;
    }

    /*****************************************
     * Stack (Memory)
     *****************************************/

    function StackPush(operands) {
        Opcode.call(this, 'push', operands);
    }

    function StackPop(operands) {
        Opcode.call(this, 'pop', operands);
    }

    /*****************************************
     * Logic
     *****************************************/

    function Return(operands) {
        Opcode.call(this, 'return', operands);
    }

    function Jump(condition, operands) {
        Opcode.call(this, condition ? 'cjump' : 'jump', operands);
        this.condition = condition;
    }

    function Compare(operands) {
        Opcode.call(this, 'cmp', operands);
    }

    /*****************************************
     * Signess
     *****************************************/

    // from unsigned to signed
    function ExtendSign(operands) {
        Opcode.call(this, 'extsign', operands);
    }

    // from signed to unsigned
    function ExtendZero(operands) {
        Opcode.call(this, 'extzero', operands);
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