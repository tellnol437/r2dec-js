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
    const IR = require('libdec/ir/ir');
    const Throw = require('libdec/throw');

    return {
        add: function(dst, src_a, src_b) {
            Throw.IsNull(dst, 'add.dst');
            Throw.IsNull(src_a, 'add.src_a');
            Throw.IsNull(src_b, 'add.src_b');
            return [new IR.Add([dst, src_a, src_b])];
        },
        subtract: function(dst, src_a, src_b) {
            Throw.IsNull(dst, 'add.dst');
            Throw.IsNull(src_a, 'add.src_a');
            Throw.IsNull(src_b, 'add.src_b');
            return [new IR.Subtract([dst, src_a, src_b])];
        },
        assign: function(dst, src) {
            Throw.IsNull(dst, 'assign.dst');
            Throw.IsNull(src, 'assign.src');
            return [new IR.Assign([dst, src])];
        },
        stack_pop: function(dst) {
            Throw.IsNull(dst, 'stack_pop.dst');
            return [new IR.StackPop([dst])];
        },
        stack_push: function(src) {
            Throw.IsNull(src, 'stack_push.src');
            return [new IR.StackPush([src])];
        },
        /* MEMORY */
        read_memory: function(pointer, register, bits, signed) {
            Throw.IsNull(pointer, 'read_memory.pointer');
            Throw.IsNull(register, 'read_memory.register');
            Throw.IsNull(bits, 'read_memory.bits');
            if (signed) {
                return [new IR.Read(bits, [register, pointer]), new IR.ExtendSign([register])];
            }
            return [new IR.Read(bits, [register, pointer])];
        },
        write_memory: function(pointer, register, bits, signed) {
            Throw.IsNull(pointer, 'read_memory.pointer');
            Throw.IsNull(register, 'read_memory.register');
            Throw.IsNull(bits, 'read_memory.bits');
            if (signed) {
                return [new IR.ExtendSign([register]), new IR.Write(bits, [register, pointer])];
            }
            return [new IR.Write(bits, [register, pointer])];
        },
        jump: function(address) {
            Throw.IsNull(address, 'jump.address');
            return [new IR.Jump(null, [address])];
        },
        jump_condition: function(address, condition) {
            Throw.IsNull(address, 'jump.address');
            Throw.IsNull(condition, 'jump.condition');
            return [new IR.Jump(condition, [address])];
        },
        compare: function(dst, src_a, src_b) {
            Throw.IsNull(dst, 'add.dst');
            Throw.IsNull(src_a, 'add.src_a');
            Throw.IsNull(src_b, 'add.src_b');
            return [new IR.Compare([dst, src_a, src_b])];
        },
        return: function() {
            return [new IR.Return(Array.prototype.slice.call(arguments))];
        },
        compose: function(ops) {
            Throw.IsNull(ops, 'compose.ops');
            var cops = [];
            ops.forEach(function(x) {
                cops = cops.concat(x);
            });
            return cops;
        },
        unknown: function(operands) {
            if (!Array.isArray(operands)) {
                operands = [operands];
            }
            return [new IR.Illegal(operands)];
        },
        nop: function() {
            return [];
        }
    };
})();