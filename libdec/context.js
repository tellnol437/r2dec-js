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
    const Base = require('libdec/ir/base');
    const Instruction = require('libdec/instruction');

    /**
     * Initialize the data given as input
     * @param  {Object} context      Context object
     * @param  {Object} data         r2 json
     * @param  {Object} architecture Architecture object
     */
    function initialize_data(context, data, architecture) {
        var block, i, instructions, instr, ir, func;
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
                console.log(instr.simplified);
                ir = func(instr, instructions) || Base.unknown(instr.assembly);
            } else {
                ir = Base.unknown(instr.assembly);
            }
            ir.forEach(function(e) {
                context.instructions.push(e);
            });
        }
    }

    function Context(data, architecture) {
        this.instructions = [];
        this.routine_name = null;
        initialize_data(this, data, architecture);
    }

    Context.prototype.dump = function() {
        console.log('[Context begin]');
        for (var i = 0; i < this.instructions.length; i++) {
            console.log('    ' + this.instructions[i]);
        }
        console.log('[Context end]');
    };

    return Context;
})();