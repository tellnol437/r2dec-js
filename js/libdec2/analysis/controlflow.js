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

    function _only_multi_from(block) {
        return block.from.length > 1;
    }

    function newFlows(blocks) {
        var join_nodes = blocks.filter(_only_multi_from);
        join_nodes.forEach(function(x) {
            console.log("    [Block 0x" + x.location.toString(16) + " " + x.opcodes.length);
            x.opcodes.forEach(function(x) {
                console.log("        " + x.asm);
            });
            console.log("    ]");
        })
    }

    return {
        newFlows: newFlows
    };
})();