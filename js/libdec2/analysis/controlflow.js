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
    //const Throw = require('libdec2/throw');
    const Block = require('libdec2/analysis/block');
    const Flow = require('libdec2/analysis/flow');
    const Utils = require('libdec2/analysis/utils');

    //function _only_multi_from(block) {
    //    //Throw.isNotObject(target, [Block], _only_multi_from);
    //    return block.from.length > 1;
    //}

    function _is_while_loop(last, from) {
        return last.from.filter(function(x) {
            return x.location.lt(from);
        }).length > 0;
    }

    function _find_subgroup_common_end(start, end, blocks) {
        var subgroup = [];
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].location.ge(start.location) && blocks[i].location.le(end.location)) {
                subgroup.push(blocks[i]);
            }
        }
        return subgroup;
    }

    function _only_loops(block) {
        return block.jump instanceof Block &&
            block.jump.location.le(block.location);
    }

    function _only_cond_jumps(block) {
        return block.jump instanceof Block && !!block.fail &&
            block.jump.location.gt(block.location);
    }

    function _print_block(x) {
        console.log("[Block 0x" + x.location.toString(16) + " " + x.opcodes.length);
        x.opcodes.forEach(function(x) {
            console.log("    " + x.asm);
        });
        console.log("]");
    }

    //function Flows(blocks) {}

    return {
        newFlows: function(blocks) {
            var join_nodes = blocks.filter(_only_loops);
            join_nodes = join_nodes.map(function(b, _, bs) {
                // looking first to while loops
                return _find_subgroup_common_end(b.jump, b, blocks);
            }).sort(function(a, b) {
                return a.length - b.length;
            });
            join_nodes.forEach(function(a) {
                console.log("--------------------------------------");
                a.forEach(_print_block);
            });
            var while_loops = join_nodes.map(function(n, _, ns) {
                var last = n[n.length - 1];
                if (_is_while_loop(last, n[0].location)) {
                    return new Flow.While(null, n);
                }
                return new Flow.DoWhile(null, n);
            });
            console.log(while_loops);
            //next only if/else
            console.log("--------------------------------------");
            join_nodes = blocks.filter(_only_cond_jumps);
            join_nodes.forEach(_print_block);
            var if_else = join_nodes.map(function(n, _, ns) {
                var last = n[n.length - 1];
                if (_is_while_loop(last, n[0].location)) {
                    return new Flow.If(null, n);
                }
                return null;
            }).filter(Utils.toBool);
            console.log(if_else);
        }
    };
})();