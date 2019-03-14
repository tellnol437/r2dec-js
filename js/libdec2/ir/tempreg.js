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

	var __internal_counter = 0;

	/**
	 * TempReg.
	 * @param {!String} name  TempReg name
	 * @param {Number}  size  TempReg size in bits
	 * @param {Number}  shift Amount of bits to shift (only for remapped regs)
	 * @constructor
	 */
	function TempReg(size) {
		Throw.isNotType(size, "number", TempReg);
		/** @type {!String} */
		this.name = "tmp" + (++__internal_counter);

		/** @type {!number} */
		this.size = size;
	}

	/**
	 * Returns true if the given object is TempReg type
	 * @param  {Object}  obj Any object
	 * @return {Boolean}
	 */
	TempReg.is = function(obj) {
		return obj instanceof TempReg;
	};

	/**
	 * Returns true if the given object is a TempReg
	 * @param  {Object}  obj Any object
	 * @return {Boolean}
	 */
	TempReg.prototype.eq = function(obj) {
		return TempReg.is(obj) && this.name == obj.name;
	};

	/**
	 * returns a string
	 * @return {String}
	 */
	TempReg.prototype.toString = function() {
		return "[Tmp " + [this.name, this.size, this.mapped.length].join(' ') + "]";
	};

	return TempReg;
})();