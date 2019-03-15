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
    const bigInt = require('libdec2/libs/bigint');

    function MetaOp(asm, ir) {
        this.asm = asm;
        this.ir = ir;
        this.toString = function() {
            return this.asm + " -> " + this.ir.join(', ');
        };
    }

    /**
     * Returns true only if the object is not null
     * @param  {any}     x Variable of any type
     * @return {boolean}
     */
    function _null_ops(x) {
        return !!x;
    }

    /**
     * Block contains microcode
     * @param {!bigInt}     location Location of the block
     */
    function Block(location, opcodes) {
        Throw.isNotObject(location, bigInt, Block);
        Throw.isNotObject(opcodes, Array, Block);
        this.location = location;
        this.jump = null;
        this.fail = null;
        this.opcodes = opcodes.map(function(x){
            return new MetaOp(x, []);
        });
        this.ir = [];
    }

    Block.prototype.setJump = function(jump) {
        Throw.isNotObject(jump, [bigInt, Block], Block);
        this.jump = jump;
    };

    Block.prototype.setFail = function(fail) {
        Throw.isNotObject(fail, [bigInt, Block], Block);
        this.fail = fail;
    };

    Block.prototype.addIR = function(opcodes) {
        this.ir = this.ir.concat(opcodes.filter(_null_ops));
    };

    Block.prototype.setMop = function(idx, opcodes) {
        this.opcodes[idx].ir = opcodes.filter(_null_ops);
    };

    return Block;
})();