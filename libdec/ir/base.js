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
    const Operand = require('libdec/ir/operand');
    const IR = require('libdec/ir/ir');
    const Throw = require('libdec/throw');

    return {
        add: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'add.dst');
            Throw.IsNull(src_a, 'add.src_a');
            Throw.IsNull(src_b, 'add.src_b');
            return [new IR.Add(location, [dst, src_a, src_b])];
        },
        subtract: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'add.dst');
            Throw.IsNull(src_a, 'add.src_a');
            Throw.IsNull(src_b, 'add.src_b');
            return [new IR.Subtract(location, [dst, src_a, src_b])];
        },
        and: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'and.dst');
            Throw.IsNull(src_a, 'and.src_a');
            Throw.IsNull(src_b, 'and.src_b');
            return [new IR.And(location, [dst, src_a, src_b])];
        },
        or: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'or.dst');
            Throw.IsNull(src_a, 'or.src_a');
            Throw.IsNull(src_b, 'or.src_b');
            return [new IR.Or(location, [dst, src_a, src_b])];
        },
        xor: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'xor.dst');
            Throw.IsNull(src_a, 'xor.src_a');
            Throw.IsNull(src_b, 'xor.src_b');
            return [new IR.Xor(location, [dst, src_a, src_b])];
        },
        negate: function(location, dst, src) {
            Throw.IsNull(dst, 'xor.dst');
            Throw.IsNull(src, 'xor.src');
            return [new IR.Negate(location, [dst, src])];
        },
        not: function(location, dst, src) {
            Throw.IsNull(dst, 'not.dst');
            Throw.IsNull(src, 'not.src');
            return [new IR.Not(location, [dst, src])];
        },
        multiply: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'multiply.dst');
            Throw.IsNull(src_a, 'multiply.src_a');
            Throw.IsNull(src_b, 'multiply.src_b');
            return [new IR.Multiply(location, [dst, src_a, src_b])];
        },
        divide: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'divide.dst');
            Throw.IsNull(src_a, 'divide.src_a');
            Throw.IsNull(src_b, 'divide.src_b');
            return [new IR.Divide(location, [dst, src_a, src_b])];
        },
        module: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'module.dst');
            Throw.IsNull(src_a, 'module.src_a');
            Throw.IsNull(src_b, 'module.src_b');
            return [new IR.Module(location, [dst, src_a, src_b])];
        },
        shift_left: function(location, dst, src_a, shift) {
            Throw.IsNull(dst, 'shift_left.dst');
            Throw.IsNull(src_a, 'shift_left.src_a');
            Throw.IsNull(shift, 'shift_left.shift');
            return [new IR.ShiftLeft(location, [dst, src_a, shift])];
        },
        shift_right: function(location, dst, src_a, shift) {
            Throw.IsNull(dst, 'shift_right.dst');
            Throw.IsNull(src_a, 'shift_right.src_a');
            Throw.IsNull(shift, 'shift_right.shift');
            return [new IR.ShiftRight(location, [dst, src_a, shift])];
        },
        assign: function(location, dst, src) {
            Throw.IsNull(dst, 'assign.dst');
            Throw.IsNull(src, 'assign.src');
            return [new IR.Assign(location, [dst, src])];
        },
        extend_sign: function(location, dst, src) {
            Throw.IsNull(dst, 'extend_sign.dst');
            Throw.IsNull(src, 'extend_sign.src');
            return [new IR.ExtendSign(location, [dst, src])];
        },
        extend_zero: function(location, dst, src) {
            Throw.IsNull(dst, 'extend_zero.dst');
            Throw.IsNull(src, 'extend_zero.src');
            return [new IR.ExtendZero(location, [dst, src])];
        },
        stack_pop: function(location, dst) {
            Throw.IsNull(dst, 'stack_pop.dst');
            return [new IR.StackPop(location, [dst])];
        },
        stack_push: function(location, src) {
            Throw.IsNull(src, 'stack_push.src');
            return [new IR.StackPush(location, [src])];
        },
        /* MEMORY */
        read_memory: function(location, pointer, register, bits, signed) {
            Throw.IsNull(pointer, 'read_memory.pointer');
            Throw.IsNull(register, 'read_memory.register');
            Throw.IsNull(bits, 'read_memory.bits');
            if (signed) {
                return [new IR.Read(location, bits, [register, pointer]), new IR.ExtendSign(null, [register, register])];
            }
            return [new IR.Read(location, bits, [register, pointer])];
        },
        write_memory: function(location, pointer, register, bits, signed) {
            Throw.IsNull(pointer, 'read_memory.pointer');
            Throw.IsNull(register, 'read_memory.register');
            Throw.IsNull(bits, 'read_memory.bits');
            if (signed) {
                return [new IR.ExtendSign(location, [register, register]), new IR.Write(null, bits, [register, pointer])];
            }
            return [new IR.Write(location, bits, [register, pointer])];
        },
        call: function(location, address) {
            Throw.IsNull(address, 'call.address');
            return [new IR.Call(location, [address])];
        },
        jump: function(location, address) {
            Throw.IsNull(address, 'jump.address');
            return [new IR.Jump(location, null, [address])];
        },
        jump_condition: function(location, address, condition) {
            Throw.IsNull(address, 'jump.address');
            Throw.IsNull(condition, 'jump.condition');
            return [new IR.Jump(location, condition, [address])];
        },
        compare: function(location, dst, src_a, src_b) {
            Throw.IsNull(dst, 'add.dst');
            Throw.IsNull(src_a, 'add.src_a');
            Throw.IsNull(src_b, 'add.src_b');
            return [new IR.Compare(location, [dst, src_a, src_b])];
        },
        conditional_assign: function(location, dst, condition, src_true, src_false) {
            Throw.IsNull(dst, 'conditional_assign.dst');
            Throw.IsNull(condition, 'conditional_assign.condition');
            Throw.IsNull(src_true, 'conditional_assign.src_true');
            Throw.IsNull(src_false, 'conditional_assign.src_false');
            return [
                new IR.Jump(location, condition, [3]),
                new IR.Assign(null, [dst, src_true]),
                new IR.Jump(null, null, [2]),
                new IR.Assign(null, [dst, src_false])
            ];
        },
        return: function(location) {
            return [new IR.Return(location, Array.prototype.slice.call(arguments, 1))];
        },
        compose: function(ops) {
            Throw.IsNull(ops, 'compose.ops');
            var cops = [];
            ops.forEach(function(x) {
                cops = cops.concat(x);
            });
            return cops;
        },
        unknown: function(location, operands) {
            if (!Array.isArray(operands)) {
                operands = [operands];
            }
            return [new IR.Illegal(location, operands)];
        },
        nop: function() {
            return [];
        }
    };
})();