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
	const JIR = require('libdec2/jir');
	const Imm = require('libdec2/ir/immediate');
	const Reg = require('libdec2/ir/register');
	const Tmp = require('libdec2/ir/tempreg');

	//http://patshaughnessy.net/assets/2016/11/26/registers.svg
	//https://wiki.skullsecurity.org/index.php?title=Registers
	const registers64 = {
		'rax': new Reg('rax', 64, 0),
		'rbx': new Reg('rbx', 64, 0),
		'rcx': new Reg('rcx', 64, 0),
		'rdx': new Reg('rdx', 64, 0),
		'rsi': new Reg('rsi', 64, 0),
		'rdi': new Reg('rdi', 64, 0),
		'rbp': new Reg('rbp', 64, 0),
		'rsp': new Reg('rsp', 64, 0),
		'r8': new Reg('r8', 64, 0),
		'r9': new Reg('r9', 64, 0),
		'r10': new Reg('r10', 64, 0),
		'r11': new Reg('r11', 64, 0),
		'r12': new Reg('r12', 64, 0),
		'r13': new Reg('r13', 64, 0),
		'r14': new Reg('r14', 64, 0),
		'r15': new Reg('r15', 64, 0),
		'rip': new Reg('rip', 64, 0),
	};

	const registers32 = {
		'eax': registers64['rax'].remap('eax', 32),
		'ebx': registers64['rbx'].remap('ebx', 32),
		'ecx': registers64['rcx'].remap('ecx', 32),
		'edx': registers64['rdx'].remap('edx', 32),
		'esi': registers64['rsi'].remap('esi', 32),
		'edi': registers64['rdi'].remap('edi', 32),
		'ebp': registers64['rbp'].remap('ebp', 32),
		'esp': registers64['rsp'].remap('esp', 32),
		'r8d': registers64['r8'].remap('r8d', 32),
		'r9d': registers64['r9'].remap('r9d', 32),
		'r10d': registers64['r10'].remap('r10d', 32),
		'r11d': registers64['r11'].remap('r11d', 32),
		'r12d': registers64['r12'].remap('r12d', 32),
		'r13d': registers64['r13'].remap('r13d', 32),
		'r14d': registers64['r14'].remap('r14d', 32),
		'r15d': registers64['r15'].remap('r15d', 32),
		'eip': registers64['rip'].remap('eip', 32),
	};

	const registers16 = {
		'ax': registers64['rax'].remap('ax', 16),
		'bx': registers64['rbx'].remap('bx', 16),
		'cx': registers64['rcx'].remap('cx', 16),
		'dx': registers64['rdx'].remap('dx', 16),
		'si': registers64['rsi'].remap('si', 16),
		'di': registers64['rdi'].remap('di', 16),
		'bp': registers64['rbp'].remap('bp', 16),
		'sp': registers64['rsp'].remap('sp', 16),
		'r8w': registers64['r8'].remap('r8w', 16),
		'r9w': registers64['r9'].remap('r9w', 16),
		'r10w': registers64['r10'].remap('r10w', 16),
		'r11w': registers64['r11'].remap('r11w', 16),
		'r12w': registers64['r12'].remap('r12w', 16),
		'r13w': registers64['r13'].remap('r13w', 16),
		'r14w': registers64['r14'].remap('r14w', 16),
		'r15w': registers64['r15'].remap('r15w', 16),
		'ip': registers64['rip'].remap('ip', 16),
		'cs': new Reg('cs', 16, 0),
		'ss': new Reg('ss', 16, 0),
		'ds': new Reg('ds', 16, 0),
		'es': new Reg('es', 16, 0),
		'fs': new Reg('fs', 16, 0),
		'gs': new Reg('gs', 16, 0),
		'tr': new Reg('tr', 16, 0),
		'gdtr': new Reg('gdtr', 16, 0),
		'idtr': new Reg('idtr', 16, 0),
		'ldtr': new Reg('ldtr', 16, 0),
	};

	const registers8hi = {
		'ah': registers64['rax'].remap('ah', 8, true),
		'bh': registers64['rbx'].remap('bh', 8, true),
		'ch': registers64['rcx'].remap('ch', 8, true),
		'dh': registers64['rdx'].remap('dh', 8, true),
	};

	const registers8low = {
		'al': registers64['rax'].remap('al', 8),
		'bl': registers64['rbx'].remap('bl', 8),
		'cl': registers64['rcx'].remap('cl', 8),
		'dl': registers64['rdx'].remap('dl', 8),
		'sil': registers64['rsi'].remap('sil', 8),
		'dil': registers64['rdi'].remap('dil', 8),
		'bpl': registers64['rbp'].remap('bpl', 8),
		'spl': registers64['rsp'].remap('spl', 8),
		'r8b': registers64['r8'].remap('r8b', 8),
		'r9b': registers64['r9'].remap('r9b', 8),
		'r10b': registers64['r10'].remap('r10b', 8),
		'r11b': registers64['r11'].remap('r11b', 8),
		'r12b': registers64['r12'].remap('r12b', 8),
		'r13b': registers64['r13'].remap('r13b', 8),
		'r14b': registers64['r14'].remap('r14b', 8),
		'r15b': registers64['r15'].remap('r15b', 8),
	};

	const registers = {
		'rax': registers64['rax'],
		'rbx': registers64['rbx'],
		'rcx': registers64['rcx'],
		'rdx': registers64['rdx'],
		'rsi': registers64['rsi'],
		'rdi': registers64['rdi'],
		'rbp': registers64['rbp'],
		'rsp': registers64['rsp'],
		'r8': registers64['r8'],
		'r9': registers64['r9'],
		'r10': registers64['r10'],
		'r11': registers64['r11'],
		'r12': registers64['r12'],
		'r13': registers64['r13'],
		'r14': registers64['r14'],
		'r15': registers64['r15'],
		'rip': registers64['rip'],
		/* registers 32 */
		'eax': registers32['eax'],
		'ebx': registers32['ebx'],
		'ecx': registers32['ecx'],
		'edx': registers32['edx'],
		'esi': registers32['esi'],
		'edi': registers32['edi'],
		'ebp': registers32['ebp'],
		'esp': registers32['esp'],
		'r8d': registers32['r8d'],
		'r9d': registers32['r9d'],
		'r10d': registers32['r10d'],
		'r11d': registers32['r11d'],
		'r12d': registers32['r12d'],
		'r13d': registers32['r13d'],
		'r14d': registers32['r14d'],
		'r15d': registers32['r15d'],
		'eip': registers32['eip'],
		/* registers 16 */
		'ax': registers16['ax'],
		'bx': registers16['bx'],
		'cx': registers16['cx'],
		'dx': registers16['dx'],
		'si': registers16['si'],
		'di': registers16['di'],
		'bp': registers16['bp'],
		'sp': registers16['sp'],
		'r8w': registers16['r8w'],
		'r9w': registers16['r9w'],
		'r10w': registers16['r10w'],
		'r11w': registers16['r11w'],
		'r12w': registers16['r12w'],
		'r13w': registers16['r13w'],
		'r14w': registers16['r14w'],
		'r15w': registers16['r15w'],
		'ip': registers16['ip'],
		'cs': registers16['cs'],
		'ss': registers16['ss'],
		'ds': registers16['ds'],
		'es': registers16['es'],
		'fs': registers16['fs'],
		'gs': registers16['gs'],
		'tr': registers16['tr'],
		'gdtr': registers16['gdtr'],
		'idtr': registers16['idtr'],
		'ldtr': registers16['ldtr'],
		/* registers 8bit (HI) */
		'ah': registers8hi['ah'],
		'bh': registers8hi['bh'],
		'ch': registers8hi['ch'],
		'dh': registers8hi['dh'],
		/* registers 8bit (LOW) */
		'al': registers8low['al'],
		'bl': registers8low['bl'],
		'cl': registers8low['cl'],
		'dl': registers8low['dl'],
		'sil': registers8low['sil'],
		'dil': registers8low['dil'],
		'bpl': registers8low['bpl'],
		'spl': registers8low['spl'],
		'r8b': registers8low['r8b'],
		'r9b': registers8low['r9b'],
		'r10b': registers8low['r10b'],
		'r11b': registers8low['r11b'],
		'r12b': registers8low['r12b'],
		'r13b': registers8low['r13b'],
		'r14b': registers8low['r14b'],
		'r15b': registers8low['r15b'],
	};

	function _parse_x86(asm) {
		// asm string will be tokenized by the following regular expression:
		//
		// (?:(repn?[ez]?|lock)\s+)?                   : instruction prefix
		// (\w+)                                       : instruction mnemonic
		// (?:\s+
		//     (byte|(?:[dq]|[xyz]mm)?word)            : first operand's memory access qualifier
		// )?
		// (?:\s*
		//     ([d-gs]s:)?                             : optional segment override
		//     (?:\[?)                                 : optional opening bracket (stripped)
		//     ([^[\],]+)                              : first operand
		//     (?:\]?)                                 : optional closing bracket (stripped)
		// )?
		// (?:,                                        : separating comma
		//     (?:\s+
		//         (byte|(?:[dq]|[xyz]mm)?word)        : second operand's memory access qualifier
		//         (?: ptr)?
		//     )?
		//     (?:\s*
		//         ([d-g]s:)?                          : optional segment override
		//         (?:\[?)                             : optional opening bracket (stripped)
		//         ([^[\],]+)                          : second operand
		//         (?:\]?)                             : optional closing bracket (stripped)
		//     )?
		// )?
		// (?:,                                        : separating comma
		//     (?:\s+
		//         ([^[\],]+)                          : third operand
		//     )?
		// )?

		/** @type {Array.<string>} */
		var tokens = asm.match(/(?:(repn?[ez]?|lock)\s+)?(\w+)(?:\s+(byte|(?:[dq]|[xyz]mm)?word))?(?:\s*([d-gs]s:)?(?:\[?)([^[\],]+)(?:\]?))?(?:(?:,)(?:\s+(byte|(?:[dq]|[xyz]mm)?word)(?: ptr)?)?(?:\s*([d-g]s:)?(?:\[?)([^[\],]+)(?:\]?))?)?(?:,(?:\s+([^[\],]+))?)?/);

		// tokens[0]: match string; irrelevant
		// tokens[1]: instruction prefix; undefined if no prefix
		// tokens[2]: instruction mnemonic
		// tokens[3]: first operand's memory access qualifier; undefined if no qualifier or no operands
		// tokens[4]: segment override for first operand; undefined if no segment override or no operands
		// tokens[5]: first operand; undefined if no operands
		// tokens[6]: second operand's memory access qualifier; undefined if no qualifier or no second operand
		// tokens[7]: segment override for second operand; undefined if no segment override or no second operand
		// tokens[8]: second operand; undefined if no second operand
		// tokens[9]: third operand; undefined if no third operand

		var prefix = tokens[1];
		var mnemonic = tokens[2];

		/** @type {Object.<string,number>} */
		var qualifier = {
			'byte': 8,
			'word': 16,
			'dword': 32,
			'qword': 64,
			'xmmword': 128,
			'ymmword': 256,
			'zmmword': 512
		};

		var operand1 = {
			mem_access: qualifier[tokens[3]],
			segovr: tokens[4],
			token: tokens[5]
		};

		var operand2 = {
			mem_access: qualifier[tokens[6]],
			segovr: tokens[7],
			token: tokens[8]
		};

		// third operand is either a register or immediate; no memory access
		var operand3 = {
			mem_access: undefined,
			segovr: undefined,
			token: tokens[9]
		};

		return {
			pref: prefix,
			mnem: mnemonic,
			opd: [operand1, operand2, operand3]
		};
	};


	/**
	 * Handles most of arithmetic and bitwise operations.
	 * @param {Object} p Parsed instruction structure
	 * @param {Object} op Operator constructor to use
	 * @param {boolean} flags Whether this operation affects system's flags (for conditions)
	 * @param {Object} context Context object
	 * @returns {Object} Instruction instance representing the required operation
	 */
	function _math_common(p, op) {
		var ops = [];
		var lhand = p.opd[0];
		var rhand = p.opd[1];

		console.log(p)

		var lhand_arg = registers[lhand.token];
		var rhand_arg = rhand.token.startsWith('0x') ? new Imm(new bigInt(rhand.token)) : registers[rhand.token];

		if (lhand.mem_access) {
			var res = new Tmp(lhand_arg.size);
			//ops.push(new JIR.Read())
		}
		if (rhand.mem_access) {
			var res = new Tmp(rhand_arg.size);
			//ops.push(new JIR.Read())
		}

		ops.push(new op(lhand_arg, lhand_arg, rhand_arg));
		return ops[0];
	};

	const _instructions = {
		inc: function(instr) {
			return new JIR.Increase(registers[instr.opd[0]], '1');
		},
		dec: function(instr) {
			return new JIR.Decrease(registers[instr.opd[0]], '1');
		},
		cld: function(instr) {
			return null;
		},
		add: function(instr) {
			return _math_common(instr, JIR.Add);
		},
		sub: function(instr) {
			return _math_common(instr, JIR.Subtract);
		},
		sbb: function(instr) {
			return _math_common(instr, JIR.Subtract);
		},
		sar: function(instr) {
			return _math_common(instr, JIR.ShiftRight);
		},
		sal: function(instr) {
			return _math_common(instr, JIR.ShiftLeft);
		},
		shr: function(instr) {
			return _math_common(instr, JIR.ShiftRight);
		},
		shl: function(instr) {
			return _math_common(instr, JIR.ShiftLeft);
		},
		and: function(instr) {
			return _math_common(instr, JIR.And);
		},
		or: function(instr) {
			return _math_common(instr, JIR.Or);
		},
		xor: function(instr) {
			return _math_common(instr, JIR.Xor);
		},
		pand: function(instr) {
			return _math_common(instr, JIR.And);
		},
		por: function(instr) {
			return _math_common(instr, JIR.Or);
		},
		pxor: function(instr) {
			return _math_common(instr, JIR.Xor);
		},
		push: function(instr) {
			var v = instr.opd[0].token.startsWith('0x') ? new Imm(new bigInt(instr.opd[0].token)) : registers[instr.opd[0].token];
			return new JIR.StackPush(v);
		},
		pop: function(instr) {
			return new JIR.StackPop(registers[instr.opd[0].token]);
		},
		/*
				div: function(instr) {
					return _math_divide(instr.parsed, false, context);
				},
				idiv: function(instr) {
					return _math_divide(instr.parsed, true, context);
				},
				mul: function(instr) {
					return _math_multiply(instr.parsed, false, context);
				},
				imul: function(instr) {
					return _math_multiply(instr.parsed, true, context);
				},
				neg: function(instr) {
					var dst = instr.parsed.opd[0];

					_has_changed_return(dst.token, true, context);
					return JIR.negate(dst.token, dst.token);
				},
				not: function(instr) {
					var dst = instr.parsed.opd[0];

					_has_changed_return(dst.token, false, context);
					return JIR.not(dst.token, dst.token);
				},
				lea: function(instr) {
					var dst = instr.parsed.opd[0];
					var val = instr.parsed.opd[1];

					_has_changed_return(dst.token, false, context);

					// compilers like to perform calculations using 'lea' instructions in the
					// following form: [reg + reg*n] --> reg * (n+1)
					var calc = val.token.match(/([re]?(?:[abcd]x|[ds]i)|r(?:1[0-5]|[8-9])[lwd]?)\s*\+\s*\1\s*\*(\d)/);

					if (calc) {
						return JIR.multiply(dst.token, calc[1], parseInt(calc[2]) + 1 + '');
					}

					// if val is an argument or local variable, it is its address that is taken
					var amp = _is_func_arg(val.token, context) || _is_local_var(val.token, context);

					var arg = instr.string ?
						Variable.string(instr.string) :
						(amp ? '&' : '') + val.token.replace(/\./g, '_');

					return JIR.assign(dst.token, arg);
				},
				call: _call_function,
				cmova: function(instr) {
					return _cmov_common(instr, 'LE');
				},
				cmovae: function(instr) {
					return _cmov_common(instr, 'LT');
				},
				cmovb: function(instr) {
					return _cmov_common(instr, 'GE');
				},
				cmovbe: function(instr) {
					return _cmov_common(instr, 'GT');
				},
				cmove: function(instr) {
					return _cmov_common(instr, 'NE');
				},
				cmovg: function(instr) {
					return _cmov_common(instr, 'LE');
				},
				cmovge: function(instr) {
					return _cmov_common(instr, 'LT');
				},
				cmovl: function(instr) {
					return _cmov_common(instr, 'GE');
				},
				cmovle: function(instr) {
					return _cmov_common(instr, 'GT');
				},
				cmovne: function(instr) {
					return _cmov_common(instr, 'EQ');
				},
				bswap: function(instr) {
					var dst = instr.parsed.opd[0];

					return JIR.swap_endian(dst.token, dst.token, _find_bits(dst.token));
				},
				mov: _standard_mov,
				movd: _standard_mov,
				movq: _standard_mov,
				movss: _standard_mov,
				// movsd: See below. Conflict with string operator
				movabs: _standard_mov,
				cbw: function(instr) {
					_has_changed_return('ax', true, context);
					return JIR.cast('ax', 'al', 'int16_t');
				},
				cwde: function(instr) {
					_has_changed_return('eax', true, context);
					return JIR.cast('eax', 'ax', 'int32_t');
				},
				cdq: function(instr) {
					_has_changed_return('eax', true, context);
					return JIR.cast('edx:eax', 'eax', 'int64_t');
				},
				cdqe: function(instr) {
					_has_changed_return('rax', true, context);
					return JIR.cast('rax', 'eax', 'int64_t');
				},
				movsx: function(instr) {
					return _extended_mov(instr.parsed, true, context);
				},
				movsxd: function(instr) {
					return _extended_mov(instr.parsed, true, context);
				},
				movzx: function(instr) {
					return _extended_mov(instr.parsed, false, context);
				},
				seta: function(instr) {
					return _setcc_common(instr.parsed, false, 'GT', context);
				},
				setae: function(instr) {
					return _setcc_common(instr.parsed, false, 'GE', context);
				},
				setb: function(instr) {
					return _setcc_common(instr.parsed, false, 'LT', context);
				},
				setbe: function(instr) {
					return _setcc_common(instr.parsed, false, 'LE', context);
				},
				setg: function(instr) {
					return _setcc_common(instr.parsed, true, 'GT', context);
				},
				setge: function(instr) {
					return _setcc_common(instr.parsed, true, 'GE', context);
				},
				setl: function(instr) {
					return _setcc_common(instr.parsed, true, 'LT', context);
				},
				setle: function(instr) {
					return _setcc_common(instr.parsed, true, 'LE', context);
				},
				sete: function(instr) {
					return _setcc_common(instr.parsed, context.returns.signed, 'EQ', context);
				},
				setne: function(instr) {
					return _setcc_common(instr.parsed, context.returns.signed, 'NE', context);
				},
				nop: function(instr) {
					return null;
				},
				leave: function(instr) {
					return null;
				},
				rol: function(instr) {
					return _bitwise_rotate(instr.parsed, JIR.rotate_left, context);
				},
				ror: function(instr) {
					return _bitwise_rotate(instr.parsed, JIR.rotate_right, context);
				},
				jmp: function(instr) {
					var dst = instr.parsed.opd[0];

					// in some cases, a jmp instruction would be considered as a function call

					if (dst.mem_access) {
						if (_is_jumping_externally(instr, instructions) || dst.token.startsWith('reloc.')) {
							// jumping to an address outside the function or to a relocatable symbol
							return JIR.call(dst.token);
						} else if (_is_local_var(dst.token, context) || dst.token.startsWith('0x')) {
							// indirectly jumping through a local variable or to an explicit memory address
							return _call_function(instr, true);
						}
					}

					var ref = dst.token.split(' ');

					// indirect jump through a register or an offset to register
					if (_x86_x64_registers.indexOf(ref[0]) > (-1)) {
						return _call_function(instr, true);
					}

					return null;
				},
				cmp: function(instr) {
					var lhand = instr.parsed.opd[0];
					var rhand = instr.parsed.opd[1];

					var a = lhand.mem_access ? Variable.pointer(lhand.token, lhand.mem_access, true) : _check_known_neg(lhand.token);
					var b = rhand.mem_access ? Variable.pointer(rhand.token, rhand.mem_access, true) : _check_known_neg(rhand.token);

					context.cond.a = a;
					context.cond.b = b;

					return null;
				},
				test: function(instr) {
					var lhand = instr.parsed.opd[0];
					var rhand = instr.parsed.opd[1];

					var a = lhand.mem_access ? Variable.pointer(lhand.token, lhand.mem_access, true) : _check_known_neg(lhand.token);
					var b = rhand.mem_access ? Variable.pointer(rhand.token, rhand.mem_access, true) : _check_known_neg(rhand.token);

					context.cond.a = (a === b) ? a : '(' + a + ' & ' + b + ')';
					context.cond.b = '0';

					return null;
				},
				ret: function(instr) {
					var register = {
						8: 'al',
						16: 'ax',
						32: 'eax',
						64: 'rax'
					}[context.returns.bits] || '';

					// if the function is not returning anything, discard the empty "return" statement at the end
					if (_is_last_instruction(instr, instructions) && (register === '')) {
						return null;
					}

					return JIR.return(register);
				},
				push: function(instr) {
					instr.valid = false;

					var val = instr.parsed.opd[0];

					return val.mem_access ?
						Variable.pointer(val.token, Extra.to.type(val.mem_access, false)) :
						val.token;
				},
				pop: function(instr, context, instrs) {
					var dst = instr.parsed.opd[0];

					// unless this 'pop' restores the frame pointer, look for the
					// assignment pattern, which is commonly used by compilers:
					//      push n  \
					//      ...      } reg = n
					//      pop reg /
					if (!_is_frame_reg(dst.token)) {
						for (var i = instrs.indexOf(instr); i >= 0; i--) {
							var mnem = instrs[i].parsed.mnem;
							var opd1 = instrs[i].parsed.opd[0];

							if (mnem === 'push') {
								mnem = 'nop';

								var value = instrs[i].string ?
									Variable.string(instrs[i].string) :
									opd1.token;

								return JIR.assign(dst.token, value);
							} else if ((mnem === 'call') || _is_stack_reg(opd1.token)) {
								break;
							}
						}
					}

					// poping into result register
					if (dst.token.match(/[er]?ax/)) {
						context.returns.bits = _return_regs_bits[dst];
						context.returns.signed = false;
					}

					return null;
				},
				lodsb: _string_common,
				lodsw: _string_common,
				lodsd: _string_common,
				lodsq: _string_common,
				stosb: _string_common,
				stosw: _string_common,
				stosd: _string_common,
				stosq: _string_common,
				movsb: _string_common,
				movsw: _string_common,
				movsd: function(instr) {
					var p = instr.parsed;
					var lhand = p.opd[0];
					var rhand = p.opd[1];

					if (_is_xmm(lhand) || _is_xmm(rhand)) {
						return _standard_mov(instr, context);
					} else {
						return _string_common(instr, context);
					}
				},
				movsq: _string_common,

				// TODO: these ones are not supported since they require an additional condition to break the loop
				// cmpsb: _string_common,
				// cmpsw: _string_common,
				// cmpsd: _string_common,
				// cmpsq: _string_common,
				// scasb: _string_common,
				// scasw: _string_common,
				// scasd: _string_common,
				// scasq: _string_common,

				jne: function(i, c) {
					return _jcc_common(i, c, 'NE');
				},
				je: function(i, c) {
					return _jcc_common(i, c, 'EQ');
				},
				ja: function(i, c) {
					return _jcc_common(i, c, 'GT');
				},
				jae: function(i, c) {
					return _jcc_common(i, c, 'GE');
				},
				jb: function(i, c) {
					return _jcc_common(i, c, 'LT');
				},
				jbe: function(i, c) {
					return _jcc_common(i, c, 'LE');
				},
				jg: function(i, c) {
					return _jcc_common(i, c, 'GT');
				},
				jge: function(i, c) {
					return _jcc_common(i, c, 'GE');
				},
				jle: function(i, c) {
					return _jcc_common(i, c, 'LE');
				},
				jl: function(i, c) {
					return _jcc_common(i, c, 'LT');
				},
				js: function(i, c) {
					return _jcc_common(i, c, 'LT');
				},
				jns: function(i, c) {
					return _jcc_common(i, c, 'GE');
				},
				xchg: function(instr) {
					var lhand = instr.parsed.opd[0];
					var rhand = instr.parsed.opd[1];

					var tmp = Variable.uniqueName('tmp');

					return JIR.composed([
						JIR.assign(tmp, lhand.token), // tmp = dest
						JIR.assign(lhand.token, rhand.token), // dest = src
						JIR.assign(rhand.token, tmp) // src = tmp
					]);
				},
				int: function(instr) {
					var syscall_num = parseInt(instr.parsed.opd[0].token).toString(16);
					var name = 'syscall_' + syscall_num + 'h';
					var regs = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'edp'];
					var info = _syscall_common(instr, instructions, Syscalls(syscall_num, 'x86'), regs);
					if (info) {
						name = info.name;
						regs = info.args;
					}
					return JIR.assign('eax', JIR.call(name, regs));
				},
				syscall: function(instr) {
					var name = 'syscall_80h';
					var regs = ['rax', 'rdi', 'rsi', 'rdx', 'r10', 'r8', 'r9'];
					var info = _syscall_common(instr, instructions, Syscalls('80', 'x86'), regs);
					if (info) {
						name = info.name;
						regs = info.args;
					}
					return JIR.assign('rax', JIR.call(name, regs));
				},
				hlt: function() {
					return JIR.return(JIR.call('_hlt', []));
				},
				*/
		invalid: function() {
			return null;
		}
	};

	return {
		pre_conversion: null,
		post_conversion: null,
		parse: function(asm) {
			var p = _parse_x86(asm);
			if (_instructions[p.mnem]) {
				return _instructions[p.mnem](p);
			}
			return new JIR.Illegal(asm);
		}
	}
})();