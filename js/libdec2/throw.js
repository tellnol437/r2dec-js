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

	function _check_array(to_check, func, error) {
		if (!Array.isArray(to_check)) {
			to_check = [to_check];
		}
		var ok = false;
		for (var i = 0; i < to_check.length; i++) {
			if (func(to_check[i])) {
				ok = true;
			}
		}
		if (!ok) {
			throw error;
		}
	}

	function IsNull(x, fcn) {
		if (typeof x == 'undefined' || (typeof x == 'object' && x == null)) {
			throw new Error('Null argument (' + fcn.name + ').');
		}
	}

	function IsGreaterThan(a, b, fcn) {
		if (a > b) {
			throw new Error('Argument ' + a + ' > ' + b + ' (' + fcn.name + ').');
		}
	}

	function IsNotType(x, type, fcn) {
		_check_array(type, function(t) {
			return typeof x == t;
		}, new Error('Argument is not right type (' + fcn.name + ').'));
	}

	function IsNotObject(x, type, fcn) {
		_check_array(type, function(t) {
			return x instanceof t;
		}, new Error('Argument is not right object (' + fcn.name + ').'));
	}

	return {
		isNull: IsNull,
		isNotType: IsNotType,
		isNotObject: IsNotObject,
		isGt: IsGreaterThan,
	};
})();