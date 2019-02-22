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
    const Base = require('libdec/ir/base');
    const Instruction = require('libdec/instruction');
    const Long = require('libdec/long');

    function find_jump(instr, instructions) {
        if (!Long.isLong(instr.operands[0].value)) {
            return;
        }
        var pos = instructions.indexOf(instr);
        for (var i = 0; i < instructions.length; i++) {
            if (instructions[i].at(instr.operands[0].value)) {
                return i - pos;
            }
        }
        return;
    }

    /**
     * Initialize the data given as input
     * @param  {Object} context      Context object
     * @param  {Object} data         r2 json
     * @param  {Object} architecture Architecture object
     */
    function initialize_data(context, data, architecture) {
        var block, i, instructions, instr, ir, func, address;
        instructions = [];
        data = data.graph[0];
        for (i = 0; i < data.blocks.length; i++) {
            block = data.blocks[i];
            instructions = instructions.concat(block.ops.filter(function(b) {
                return b.opcode != null;
            }).map(function(b) {
                return new Instruction(b, architecture);
            }));
        }
        for (i = 0; i < instructions.length; i++) {
            instr = instructions[i];
            if (!instr.is_valid()) {
                Global.warning("invalid mnem. stopping instruction analysis.");
                break;
            }
            func = architecture.instructions[instr.parsed.mnem];
            if (func) {
                //console.log(instr.assembly);
                ir = func(instr, instructions) || Base.unknown(instr.location, instr.assembly);
                //console.log('    '  + ir.join('\n    '))
            } else {
                ir = Base.unknown(instr.location, instr.assembly);
            }
            ir.forEach(function(e) {
                context.instructions.push(e);
            });
        }
        address = null;
        for (i = 0; i < context.instructions.length; i++) {
            instr = context.instructions[i];
            if (address && instr.at(address)) {
                instr.location = Long.MAX_UNSIGNED_VALUE;
            } else if (!instr.location.eq(Long.MAX_UNSIGNED_VALUE)) {
                address = instr.location;
            }
            if (IR.Jump.is(instructions[i])) {
                var index = find_jump(instructions[i], instructions);
                if (typeof index != 'undefined') {
                    IR.Jump.set(instructions[i], index);
                }
            }
        }
        console.log('size', context.instructions.length);
    }

    function Context(data, architecture) {
        this.instructions = [];
        this.routine_name = null;
        initialize_data(this, data, architecture);
    }

    Context.prototype.dump = function() {
        var size = this.instructions.length;
        console.log('[Context begin:' + size + ']');
        for (var i = 0; i < size; i++) {
            console.log('    ' + this.instructions[i]);
        }
        console.log('[Context end:' + size + ']');
    };

    return Context;
})();