/*
 * Copyright (C) 2017-2019 deroad, elicn
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

	function atob(data) {
		return new TextDecoder().decode(Duktape.dec('base64', data));
	}

	function Instruction(data, architecture) {
		this.jump = data.jump;
		this.location = data.offset;
		this.simplified = data.disasm || data.opcode;
		this.assembly = data.opcode;
		this.parsed = architecture.parse(data.disasm, data.opcode);
		this.comments = data.comment ? [atob(data.comment)] : [];
	}
	Instruction.prototype.is_valid = function() {
		return this.parsed.mnem && this.parsed.mnem.length > 0;
	};
	Instruction.prototype.is_jumping_externally = function(instructions) {
		var first_inst = instructions[0];
		var last_inst = instructions[instructions.length - 1];
		return this.jump && (this.jump.gt(last_inst) || this.jump.lt(first_inst.location));
	};

	return Instruction;
})();