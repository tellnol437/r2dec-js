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
	const BigInt = require('libdec2/libs/bigint');

	/**
	 * Immediate value.
	 * @param {!BigInt} value Immediate value
	 * @constructor
	 */
	function Immediate(value) {
		Throw.isNotObject(value, BigInt, Immediate);
		/** @type {!BigInt} */
		this.value = value;
	}

	/**
	 * Returns true if the given object is Immediate type
	 * @param  {Object}  obj Any object
	 * @return {Boolean}
	 */
	Immediate.is = function(obj) {
		return obj instanceof Immediate;
	};

	/**
	 * returns a string
	 * @return {String}
	 */
	Immediate.prototype.toString = function() {
		return "[Imm 0x" + this.value.toString(16) + "]";
	};

	return Immediate;
})();