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
	const bigInt = require('libdec2/libs/bigint');
	const _JSON = require('libdec2/libs/json64');

	var _internal_data = null;

	function r2cmd(x) {
		if (!_internal_data[x]) {
			console.log("trying to load '" + x + "'.");
			return null;
		}
		return _internal_data[x];
	}

	function r2str(value, multiline) {
		var x = r2cmd(value);
		return multiline ? x.replace(/\n/g, '') : x.trim();
	}

	function r2json(m, def) {
		var x = r2str(m, true);
		return x.length > 0 ? _JSON.parse(x) : def;
	}

	function r2int(value, def) {
		var x = r2str(value);
		if (x != '') {
			try {
				return parseInt(x);
			} catch (e) {}
		}
		return def;
	}

	function r2bigint(value, def) {
		var x = r2str(value);
		if (x != '') {
			var radix = 10;
			if (x.startsWith('0x')) {
				radix = 16;
				x = x.substr(2);
			}
			try {
				return new bigInt(x, radix);
			} catch (e) {}
		}
		return def;

	}

	function r2bool(value) {
		var x = r2str(value);
		return x == 'true' || x == '1';
	}

	function r2dec_sanitize(enable, evar, oldstatus, newstatus) {
		if (enable) {
			r2cmd('e ' + evar + ' = ' + newstatus);
		} else {
			r2cmd('e ' + evar + ' = ' + oldstatus);
		}
	}

	function Sanitize() {
		this.set = function(enable) {};
	}

	function load(filename) {
		_internal_data = _JSON.parse(read_file(filename).trim());
	}

	return {
		string: r2str,
		json: r2json,
		number: r2int,
		bigint: r2bigint,
		bool: r2bool,
		sanitize: Sanitize,
		load: load,
	};
})();