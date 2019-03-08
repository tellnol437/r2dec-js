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
	const BigInt = require('libdec2/libs/bigint');
	const _JSON = require('libdec2/libs/json64');

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
			radix = 10;
			if (x.startsWith('0x')) {
				radix = 16;
				x = x.substr(2);
			}
			try {
				return new BigInt(x, radix);
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
		this.ucase = r2bool('e asm.ucase');
		this.pseudo = r2bool('e asm.pseudo');
		this.capitalize = r2bool('e asm.capitalize');
		this.set = function(enable) {
			r2dec_sanitize(enable, 'asm.ucase', this.ucase, 'false');
			r2dec_sanitize(enable, 'asm.pseudo', this.pseudo, 'false');
			r2dec_sanitize(enable, 'asm.capitalize', this.capitalize, 'false');
		}
	}

	return {
		string: r2str,
		json: r2json,
		number: r2int,
		bigint: r2bigint,
		bool: r2bool,
		sanitize: Sanitize,
	};
})();