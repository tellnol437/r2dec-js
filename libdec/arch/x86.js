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
    const Condition = require('libdec/ir/condition');
    const Operand = require('libdec/ir/operand');
    const Base = require('libdec/ir/base');
    const Helper = require('libdec/helper');
    const Long = require('libdec/long');

    /**
     * x86_x64 flags register
     * @type {Object}
     */
    const FlagsReg = new Operand.Register('rflags', 64);

    /**
     * Convert known magic values known to represent negative numbers.
     * @param {string} x Value string
     * @returns {string} Negative representation of `x` if known to be a negative value, `x` otherwise
     */
    function _check_known_neg(x) {
        var arch_minus_one;

        switch (Global.evars.archbits) {
            case 64:
                arch_minus_one = '0xffffffffffffffff';
                break;
            case 32:
                arch_minus_one = '0xffffffff';
                break;
            case 16:
                arch_minus_one = '0xffff';
                break;
        }

        return (x === arch_minus_one ? Long.NEG_ONE : x);
    }

    /**
     * General purpose registers, plus a few others
     * @type {Array.<string>}
     */
    var _x86_x64_registers = {
        'rax': new Operand.Register('rax', 64),
        'eax': new Operand.Register('eax', 32),
        'ax': new Operand.Register('ax', 16),
        'al': new Operand.Register('al', 8),
        'ah': new Operand.Register('ah', 8),
        'rbx': new Operand.Register('rbx', 64),
        'ebx': new Operand.Register('ebx', 32),
        'bx': new Operand.Register('bx', 16),
        'bl': new Operand.Register('bl', 8),
        'bh': new Operand.Register('bh', 8),
        'rcx': new Operand.Register('rcx', 64),
        'ecx': new Operand.Register('ecx', 32),
        'cx': new Operand.Register('cx', 16),
        'cl': new Operand.Register('cl', 8),
        'ch': new Operand.Register('ch', 8),
        'rdx': new Operand.Register('rdx', 64),
        'edx': new Operand.Register('edx', 32),
        'dx': new Operand.Register('dx', 16),
        'dl': new Operand.Register('dl', 8),
        'dh': new Operand.Register('dh', 8),
        'rsi': new Operand.Register('rsi', 64),
        'esi': new Operand.Register('esi', 32),
        'si': new Operand.Register('si', 16),
        'sil': new Operand.Register('sil', 8),
        'rdi': new Operand.Register('rdi', 64),
        'edi': new Operand.Register('edi', 32),
        'di': new Operand.Register('di', 16),
        'dil': new Operand.Register('dil', 8),
        'rbp': new Operand.Register('rbp', 64),
        'ebp': new Operand.Register('ebp', 32),
        'bp': new Operand.Register('bp', 16),
        'bpl': new Operand.Register('bpl', 8),
        'rsp': new Operand.Register('rsp', 64),
        'esp': new Operand.Register('esp', 32),
        'sp': new Operand.Register('sp', 16),
        'spl': new Operand.Register('spl', 8),
        'r8': new Operand.Register('r8', 64),
        'r8d': new Operand.Register('r8d', 32),
        'r8w': new Operand.Register('r8w', 16),
        'r8b': new Operand.Register('r8b', 8),
        'r9': new Operand.Register('r9', 64),
        'r9d': new Operand.Register('r9d', 32),
        'r9w': new Operand.Register('r9w', 16),
        'r9b': new Operand.Register('r9b', 8),
        'r10': new Operand.Register('r10', 64),
        'r10d': new Operand.Register('r10d', 32),
        'r10w': new Operand.Register('r10w', 16),
        'r10b': new Operand.Register('r10b', 8),
        'r11': new Operand.Register('r11', 64),
        'r11d': new Operand.Register('r11d', 32),
        'r11w': new Operand.Register('r11w', 16),
        'r11b': new Operand.Register('r11b', 8),
        'r12': new Operand.Register('r12', 64),
        'r12d': new Operand.Register('r12d', 32),
        'r12w': new Operand.Register('r12w', 16),
        'r12b': new Operand.Register('r12b', 8),
        'r13': new Operand.Register('r13', 64),
        'r13d': new Operand.Register('r13d', 32),
        'r13w': new Operand.Register('r13w', 16),
        'r13b': new Operand.Register('r13b', 8),
        'r14': new Operand.Register('r14', 64),
        'r14d': new Operand.Register('r14d', 32),
        'r14w': new Operand.Register('r14w', 16),
        'r14b': new Operand.Register('r14b', 8),
        'r15': new Operand.Register('r15', 64),
        'r15d': new Operand.Register('r15d', 32),
        'r15w': new Operand.Register('r15w', 16),
        'r15b': new Operand.Register('r15b', 8),
        'rip': new Operand.Register('rip', 64),
        'eip': new Operand.Register('eip', 32),
        'ip': new Operand.Register('ip', 16),
        'cs': new Operand.Register('cs', 16),
        'ss': new Operand.Register('ss', 16),
        'ds': new Operand.Register('ds', 16),
        'es': new Operand.Register('es', 16),
        'fs': new Operand.Register('fs', 16),
        'gs': new Operand.Register('gs', 16),
        'tr': new Operand.Register('tr', 16),
        'gdtr': new Operand.Register('gdtr', 16),
        'idtr': new Operand.Register('idtr', 16),
        'ldtr': new Operand.Register('ldtr', 16),
    };

    const math_ops = {
        '+': Base.add,
        '-': Base.subtract,
        '*': Base.multiply,
    };

    /**
     * Returns an operand from a given instruction
     * @param  {Object} instr Instruction object
     * @param  {Number} index Number
     * @return {Object}       JSON object
     */
    function _op(instr, index) {
        return instr.parsed.operands[index];
    }

    /**
     * Returns the operand definition from a given instruction
     * @param  {Object} instr Instruction object
     * @param  {Number} index Number
     * @return {Object}       Operand object
     */
    function _ireg(instr, index) {
        var register = _op(instr, index).token;
        return _x86_x64_registers[register];
    }

    /**
     * Returns the operand definition from a given parsed register
     * @param  {Object} instr Instruction object
     * @param  {Number} index Number
     * @return {Object}       Operand object
     */
    function _reg(register) {
        return _x86_x64_registers[register];
    }

    /**
     * Returns an Operand.Immediate object
     * @param  {String} value string
     * @return {Object}
     */
    function _imm(value) {
        return new Operand.Immediate(value, Global.evars.archbits);
    }

    /**
     * Returns the operand definition from a given instruction
     * @param  {Object} instr Instruction object
     * @param  {Number} index Number
     * @return {Object}       Operand object
     */
    function _imm2(instr, index) {
        return _imm(_op(instr, index).token);
    }

    function _multi_math(location, value, ops) {
        var reg_a, reg_b;
        var math = value.token.replace(/([+*-])/g, ' $1 ').replace(/\s+/g, ' ').split(' ');
        if (math.length > 2) {
            reg_a = _reg(math[0]) || _imm(math[0]);
            reg_b = _reg(math[2]) || _imm(math[2]);
            value = new Operand.TempRegister(reg_a.size);
            ops.push(math_ops[math[1]](location, value, reg_a, reg_b));
            if (math.length > 3) {
                reg_b = _reg(math[4]) || _imm(math[4]);
                ops.push(math_ops[math[3]](location, value, value, reg_b));
            }
        } else {
            value = _reg(value.token) || _imm(value.token);
        }
        return value;
    }

    /**
     * Is used internally to return a register or a temporaru memory operand
     * @param  {Object} value Parsed json
     * @param  {Array}  ops   Array of ops
     * @return {Object}       Operand
     */
    function _memory_composed(location, value, ops) {
        var cmp_arg = _reg(value.token);
        if (!cmp_arg && value.mem_access) {
            value = _multi_math(location, value, ops);
            var tmp = new Operand.TempRegister(value.size);
            ops.push(Base.read_memory(location, value, tmp, value.size, true));
            cmp_arg = tmp;
        } else {
            cmp_arg = _imm(_check_known_neg(value.token));
        }
        return cmp_arg;
    }

    /**
     * Handles most of arithmetic and bitwise operations.
     * @param   {Object}  instr    Instruction structure
     * @param   {Object}  op       Operator constructor to use
     * @param   {boolean} flags    Whether this operation affects system's flags (for conditions)
     * @param   {Object}  context  Context object
     * @returns {Object}           Instruction instance representing the required operation
     */
    function _math_common(instr, op, flags) {
        var ops = [],
            dst = _memory_composed(instr.location, _op(instr, 0), ops),
            src = _memory_composed(instr.location, _op(instr, 1), ops);
        ops.push(op(instr.location, dst, dst, src));
        return Base.compose(ops);
    }

    /**
     * Handles arithmetic divisions.
     * @param {Object} p Parsed instruction structure
     * @param {boolean} signed Signed operation or operands
     * @param {Object} context Context object
     */
    var _math_divide = function(instr, signed) {
        var l = instr.location;
        var divisor = _op(instr, 0);
        var osize = divisor.mem_access || _reg(divisor.token).size;

        var dividend = {
            8: ['ax'],
            16: ['dx', 'ax'],
            32: ['edx', 'eax'],
            64: ['rdx', 'rax']
        }[osize];

        var remainder = {
            8: 'ah',
            16: 'dx',
            32: 'edx',
            64: 'rdx',
        }[osize];

        var quotient = {
            8: 'al',
            16: 'ax',
            32: 'eax',
            64: 'rax'
        }[osize];

        var hi, low, ops = [];
        if (osize > 8) {
            hi = _reg(dividend[0]);
            low = _reg(dividend[1]);
            dividend = new Operand.TempRegister(osize);
            ops.push(Base.shift_left(l, dividend, hi, osize));
            ops.push(Base.or(l, dividend, dividend, low));
        } else {
            dividend = _reg(dividend[0]);
        }
        quotient = _reg(quotient);
        remainder = _reg(remainder);
        divisor = _reg(divisor.token);

        // quotient = dividend / divisor
        // remainder = dividend % divisor
        return Base.compose([
            Base.divide(l, quotient, dividend, divisor),
            Base.module(l, remainder, dividend, divisor)
        ]);
    };


    /**
     * Handles Jcc (conditional jump) instructions.
     * @param {Object} p Parsed instruction structure
     * @param {Object} context Context object
     * @param {string} type Condition type symbol
     */
    var _jcc_common = function(instr, instructions, type) {
        //if (instr.is_jumping_externally(instructions)) {
        //    return Base.jump_condition(_imm2(instr, 0), type);
        //}
        return Base.jump_condition(instr.location, _imm2(instr, 0), type);
    };

    function _standard_mov(instr) {
        var dst = _op(instr, 0);
        var src = _op(instr, 1);
        var ops = [];
        if (dst.mem_access) {
            dst = _multi_math(instr.location, dst, ops);
            ops.push(Base.write_memory(instr.location, dst, _reg(src.token) || _imm(src.token), dst.size, false));
            return Base.compose(ops);
        } else if (src.mem_access) {
            src = _multi_math(instr.location, src, ops);
            ops.push(Base.read_memory(instr.location, src, _reg(dst.token) || _imm(dst.token), src.size, false));
            return Base.compose(ops);
        }
        return Base.assign(instr.location, _reg(dst.token), _reg(src.token) || _imm(src.token));
    }

    /**
     * Hanldes assignments that require size extension.
     * @param {Object}  instr   Parsed instruction structure
     * @param {Boolean} signed  Signed operation
     * @param {Object}  context Context structure
     */
    function _extended_mov(instr, signed) {
        var dst = _op(instr, 0);
        var src = _op(instr, 1);

        if (src.mem_access) {
            var ops = [];
            src = _multi_math(instr.location, src, ops);
            ops.push(Base.read_memory(instr.location, src, _reg(dst.token) || _imm(dst.token), src.size, signed));
            return Base.compose(ops);
        }
        dst = _reg(dst.token) || _imm(dst.token);
        src = _reg(src.token) || _imm(src.token);
        return Base.extend_sign(instr.location, dst, src);
    }

    return {
        instructions: {
            //cld: function(instr) {
            //    return Base.nop();
            //},
            inc: function(instr) {
                instr.parsed.operands[1].token = '1'; // dirty hack :(
                return _math_common(instr, Base.add, true);
            },
            dec: function(instr) {
                instr.parsed.operands[1].token = '1'; // dirty hack :(
                return _math_common(instr, Base.subtract, true);
            },
            add: function(instr) {
                return _math_common(instr, Base.add, true);
            },
            sub: function(instr) {
                return _math_common(instr, Base.subtract, true);
            },
            sbb: function(instr) {
                return _math_common(instr, Base.subtract, true);
            },
            sar: function(instr) {
                return _math_common(instr, Base.shift_right, true);
            },
            sal: function(instr) {
                return _math_common(instr, Base.shift_left, true);
            },
            shr: function(instr) {
                return _math_common(instr, Base.shift_right, true);
            },
            shl: function(instr) {
                return _math_common(instr, Base.shift_left, true);
            },
            and: function(instr) {
                return _math_common(instr, Base.and, true);
            },
            or: function(instr) {
                return _math_common(instr, Base.or, true);
            },
            xor: function(instr) {
                return _math_common(instr, Base.xor, false);
            },
            pand: function(instr) {
                return _math_common(instr, Base.and, false);
            },
            por: function(instr) {
                return _math_common(instr, Base.or, false);
            },
            pxor: function(instr) {
                return _math_common(instr, Base.xor, false);
            },
            neg: function(instr) {
                var dst = _ireg(instr, 0);
                return Base.negate(instr.location, dst, dst);
            },
            not: function(instr) {
                var dst = _ireg(instr, 0);
                return Base.not(instr.location, dst, dst);
            },
            cbw: function(instr, context) {
                return Base.extend_sign(instr.location, _reg('ax'), _reg('al'));
            },
            cwde: function(instr, context) {
                return Base.extend_sign(instr.location, _reg('eax'), _reg('ax'));
            },
            cdqe: function(instr) {
                return Base.extend_sign(instr.location, _reg('rax'), _reg('eax'));
            },
            div: function(instr) {
                return _math_divide(instr, false);
            },
            idiv: function(instr) {
                return _math_divide(instr, true);
            },
            /*
            mul: function(instr) {
                return _math_multiply(instr, false);
            },
            imul: function(instr) {
                return _math_multiply(instr, true);
            },
            */
            push: function(instr, instructions) {
                return Base.stack_push(instr.location, _ireg(instr, 0));
            },
            pop: function(instr, instructions) {
                return Base.stack_pop(instr.location, _ireg(instr, 0));
            },
            lea: function(instr) {
                var ops = [];
                var dst = _ireg(instr, 0);
                var val = _multi_math(instr.location, _op(instr, 1), ops);
                ops.push(Base.assign(instr.location, dst, val));
                return Base.compose(ops);
            },
            mov: _standard_mov,
            movd: _standard_mov,
            movq: _standard_mov,
            movss: _standard_mov,
            /* movsd: See below. Conflict with string operator */
            movabs: _standard_mov,
            movsx: function(instr) {
                return _extended_mov(instr, true);
            },
            movsxd: function(instr) {
                return _extended_mov(instr, true);
            },
            movzx: function(instr) {
                return _extended_mov(instr, false);
            },
            call: function(instr, instructions) {
                var ops = [];
                var dst = _op(instr, 0);
                if (dst.mem_access) {
                    dst = _memory_composed(instr.location, dst, ops);
                } else {
                    ops.push(Base.call(instr.location, _ireg(instr, 0) || _imm2(instr, 0)));
                }
                return Base.compose(ops);
            },
            jmp: function(instr, instructions) {
                var dst = _op(instr, 0);

                /*
                //TODO FIX ME

                // in some cases, a jmp instruction would be considered as a function call
                if (dst.mem_access) {
                    if (instr.is_jumping_externally(instructions)) {
                        // jumping to an address outside the function or to a relocatable symbol
                        return Base.call(dst.token);
                    } else if ( _is_local_var(dst.token, context) || dst.token.startsWith('0x')) {
                        // indirectly jumping through a local variable or to an explicit memory address
                        return Base.jump(_ireg(instr, 0) || _imm(dst.token)); //_call_function(instr, instructions, true);
                    }
                }
                */
                // indirect jump through a register or an offset to register
                return Base.jump(instr.location, _ireg(instr, 0) || _imm(dst.token));
            },
            jne: function(i, is) {
                return _jcc_common(i, is, Condition.NE);
            },
            je: function(i, is) {
                return _jcc_common(i, is, Condition.EQ);
            },
            ja: function(i, is) {
                return _jcc_common(i, is, Condition.GT_U);
            },
            jae: function(i, is) {
                return _jcc_common(i, is, Condition.GE_U);
            },
            jb: function(i, is) {
                return _jcc_common(i, is, Condition.LT_U);
            },
            jbe: function(i, is) {
                return _jcc_common(i, is, Condition.LE_U);
            },
            jg: function(i, is) {
                return _jcc_common(i, is, Condition.GT_S);
            },
            jge: function(i, is) {
                return _jcc_common(i, is, Condition.GE_S);
            },
            jle: function(i, is) {
                return _jcc_common(i, is, Condition.LE_S);
            },
            jl: function(i, is) {
                return _jcc_common(i, is, Condition.LT_S);
            },
            js: function(i, is) {
                return _jcc_common(i, is, Condition.LT_U);
            },
            jns: function(i, is) {
                return _jcc_common(i, is, Condition.GE_U);
            },
            cmp: function(instr) {
                var ops = [],
                    a = _memory_composed(instr.location, _op(instr, 0), ops),
                    b = _memory_composed(instr.location, _op(instr, 1), ops);
                ops.push(Base.compare(instr.location, FlagsReg, a, b));
                return Base.compose(ops);
            },
            test: function(instr) {
                var tmp = null,
                    ops = [],
                    a = _memory_composed(instr.location, _op(instr, 0), ops),
                    b = _memory_composed(instr.location, _op(instr, 1), ops);
                if (a != b) {
                    tmp = new Operand.TempRegister(Math.max(a.size, b.size));
                    ops.push(Base.and(instr.location, tmp, a, b));
                    a = tmp;
                }
                ops.push(Base.compare(instr.location, FlagsReg, a, _imm('0')));
                return Base.compose(ops);
            },
            ret: function(instr) {
                return Base.return(instr.location);
            },
            nop: function() {
                return Base.nop();
            },
            invalid: function() {
                return Base.nop();
            }
        },
        parse: function(asm) {
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

            return new Helper.Parsed(mnemonic, [operand1, operand2, operand3], prefix);
        }
    };
})();