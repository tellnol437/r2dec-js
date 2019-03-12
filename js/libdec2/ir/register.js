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

	/**
	 * Register.
	 * @param {!String} name  Register name
	 * @param {Number}  size  Register size in bits
	 * @param {Number}  shift Amount of bits to shift (only for remapped regs)
	 * @constructor
	 */
	function Register(name, size, shift) {
		Throw.isNotType(name, "string", Register);
		Throw.isNotType(size, "number", Register);
		/** @type {!String} */
		this.name = name;

		/** @type {!number} */
		this.size = size || 0;

		/** @type {Array} */
		this.mapped = [];
	}

	/**
	 * Returns true if the given object is Register type
	 * @param  {Object}  obj Any object
	 * @return {Boolean}
	 */
	Register.is = function(obj) {
		return obj instanceof Register;
	};

	/**
	 * Returns true if the given object is a Register
	 * @param  {Object}  obj Any object
	 * @return {Boolean}
	 */
	Register.prototype.eq = function(obj) {
		return Register.is(obj) && (this.name == obj.name || this.mapped.indexOf(obj.name) >= 0);
	};

	/**
	 * Remaps a register to a lower one.
	 * @param  {!String}  name   Register name
	 * @param  {Number}   size   Register size in bits
	 * @param  {Boolean}  isHigh Set to true if it is a shifted register
	 * @return {Register}
	 */
	Register.prototype.remap = function(name, size, isHigh) {
		Throw.isGt(size, this.size, Register);
		this.mapped.push(name);
		return new Register(name, size, isHigh ? size : 0);
	};

	/**
	 * returns a string
	 * @return {String}
	 */
	Register.prototype.toString = function() {
		return "[Reg " + [this.name, this.size, this.mapped.length].join(' ') + "]";
	};

	return Register;
})();