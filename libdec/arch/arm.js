/* 
 * Copyright (C) 2017-2018 deroad
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

    const Variable = require('libdec/core/variable');
    const Base = require('libdec/core/base');
    const Extra = require('libdec/core/extra');
    const Long = require('libdec/long');
    const ObjC = require('libdec/core/objc');

    const _zero_regs = ['wzr', 'xzr'];

    var _operands = {
        'lsl': '<<',
        'sxtw': '<<',
        'uxtw': '<<',
        'lsr': '>>',
        'asl': '<<',
        'asr': '>>',
        'ror': '>>>',
        'rrx': '>>>'
    };

    var _operands_base = {
        'lsl': Base.shift_left,
        'sxtw': Base.shift_left,
        'uxtw': Base.shift_left,
        'lsr': Base.shift_right,
        'asl': Base.shift_left,
        'asr': Base.shift_right,
        'ror': Base.rotate_right,
        'rrx': Base.rotate_right
    };

    var _reg_bits = {
        'b': 8,
        'h': 16,
        's': 32,
        'r': 32,
        'w': 32,
        'd': 64,
        'x': 64,
        'q': 128
    };

    function _register_size(reg) {
        if (reg && reg.startsWith("x")) {
            return 64;
        }
        return 32;
    }

    var _common_math = function(e, op) {
        if (e.opd[0] == 'ip' || e.opd[0] == 'sp' || e.opd[0] == 'fp') {
            return Base.nop();
        }
        if (e.opd.length == 2) {
            return op(e.opd[0], e.opd[0], e.opd[1]);
        } else if (e.opd.length == 3) {
            return op(e.opd[0], e.opd[1], e.opd[2]);
        }
        var p = e.opd.slice(2);
        if (_operands[p[1]]) {
            p[1] = _operands[p[1]];
            if (p.length == 2) {
                p[2] = e.opd[1];
            }
        }
        return op(e.opd[0], e.opd[1], '(' + p.join(' ') + ')');
    };

    var _memory = function(op, instr, bits, signed) {
        signed = signed || false;
        var e = instr.parsed.opd;
        var mem, arg;
        if (e[0] == 'lr') {
            return null;
        }
        if (!bits) {
            bits = 32;
        }
        var last = e[e.length - 1];
        if (e.length == 2 && typeof e[1] == 'string') {
            return Base.assign(e[0], instr.string || e[1]);
        } else if (e.length == 2) {
            //str A, [B...] is *((u32*) B...) = A;
            mem = e[1].slice();
            if (mem.length < 3) {
                return op(mem.join(' + ').replace(/\+ -/, '- '), e[0], bits, false);
            }
            arg = Variable.uniqueName('offset');
            return Base.composed([
                _operands_base[mem[2]](arg, mem[1], mem[3], bits),
                op([mem[0], arg].join(' + ').replace(/\+ -/, '- '), e[0], bits, false),
            ]);
        } else if (e.length == 3 && last == "!") {
            mem = e[1].slice();
            if (mem.length < 3) {
                return op(mem.join(' += ').replace(/\+=\s-/, '-= '), e[0], bits, false);
            }
            arg = Variable.uniqueName('offset');
            return Base.composed([
                _operands_base[mem[2]](arg, mem[1], mem[3], bits),
                op([mem[0], arg].join(' += ').replace(/\+=\s-/, '-= '), e[0], bits, false),
            ]);
        }
        mem = e[1].slice();
        if (mem.length < 3) {
            return Base.composed([
                op(mem.join(' + ').replace(/\+ -/, '- '), e[0], bits, false),
                Base.add(mem[0], mem[0], last)
            ]);
        }
        arg = Variable.uniqueName('offset');
        return Base.composed([
            _operands_base[mem[2]](arg, mem[1], mem[3], bits),
            op([mem[0], arg].join(' + ').replace(/\+ -/, '- '), e[0], bits, false),
            Base.add(mem[0], mem[0], last)
        ]);
    };

    var _compare = function(instr, context) {
        if (instr.mnem == 'cmn') {
            context.cond.a = instr.parsed.opd[1];
            context.cond.b = instr.parsed.opd[0];
        } else {
            context.cond.a = instr.parsed.opd[0];
            context.cond.b = instr.parsed.opd[1];
        }
        return Base.nop();
    };

    var _conditional = function(instr, context, type) {
        return instr.conditional(context.cond.a, context.cond.b, type);
    };

    var _conditional_inline = function(instr, context, instructions, type) {
        instr.conditional(context.cond.a, context.cond.b, type);
        var next = instructions[instructions.indexOf(instr) + 1];
        if (next) {
            instr.jump = next.location;
        } else {
            instr.jump = instr.location.add(1);
        }
    };

    var _fix_arg = function(instr) {
        //var t = instr.code.toString();
        //if (t.match(/^.+[+-|&^*/%]=\s/) || t.match(/^\s[+-|&^*/%]\s/)) {
        //instr.valid = false;
        return instr.string ? Variable.string(instr.string) : Variable.local(instr.parsed.opd[0], _register_size(instr.parsed.opd[0]));
        //}
        //t = t.replace(/^.+\s=\s/, '').trim();
        //instr.valid = false;
        //return instr.string ? Variable.string(instr.string) : Variable.local(t, _register_size(t));
    };

    /**
     * For a given local variable `name`, retreive its offset from the frame pointer. This become handy when
     * local variables are referred by their name, but there is a need to query their offset; e.g. returns
     * 16 when a variable is referred by rbp + 16.
     * @param {string} name A string literal
     * @param {Object} context
     * @returns {number} Offset from frame pointer (in bytes), or undefined if no such variable name or
     * variable exists, but is not on stack
     */
    var _get_var_offset = function(name, context) {
        // TODO: could be done simply with 'find' on ES6, unfortunately Duktape does not recognize it yet
        var info;

        context.vars.forEach(function(v) {
            if (v.name == name) {
                info = v;
            }
        });

        return info ? info.ref.offset.low : undefined;
    };

    /**
     * Return a list of the cdecl function call arguments.
     * @param {Array<Object>} instrs Array of instructions preceding the function call
     * @param {number} nargs Number of arguments expected for this function call
     * @param {Object} context Context object
     * @returns {Array<Variable>} An array of arguments instances, ordered as declared in callee
     */
    var _populate_cdecl_call_args = function(instrs, nargs, context) {
        var args = [];
        var argidx = 0;
        var arg;

        for (var i = (instrs.length - 1);
            (i >= 0) && (nargs > 0); i--) {
            var mnem = instrs[i].parsed.mnem;
            var opd1 = instrs[i].parsed.opd[0];
            var opd2 = instrs[i].parsed.opd[1];

            // passing argument by referring to stack pointer directly rather than pushing
            if (mnem === 'adrp') {
                // normally arguments will be passed in the order they are defined at the callee declaration. however
                // it is not guaranteed, so we will need the stack offset that is used to determine which argument
                // is being set; for example, "mov val [a + b]" indicates that the 3rd argument is being set

                var offset;

                // opd1 may be set to a variable name, and therefore mask the stack pointer dereference. for that
                // reason we also check whether it appears as a stack variable, to extract its offset from stack pointer.
                // [another option would be undefining that variable manually using the "afvs-" r2 command]

                // check whether this is a plain stack pointer dereference, or a stack pointer dereference masekd by a
                // variable name. if the former, extract the offset manually; if the latter, use r2 data to retreive
                // that value.
                if (opd1.mem_access && _is_stack_reg(opd1)) {
                    offset = 0;
                } else if (_is_stack_based_local_var(opd1, context)) {
                    offset = Math.abs(_get_var_offset(opd1, context));
                } else {
                    // an irrelevant 'mov' isntruction; nothing to do here
                    continue;
                }

                arg = instrs[i].string ? Variable.string(instrs[i].string) : Variable.local(opd2, _register_size(opd2));

                instrs[i].valid = false;
                args[offset / (Global.evars.archbits / 8)] = arg;
                nargs--;
            }

            // passing argument by pushing them to stack
            if (mnem === 'push') {
                arg = instrs[i].string ? Variable.string(instrs[i].string) : Variable.local(opd1, _register_size(opd1));

                instrs[i].valid = false;
                args[argidx++] = arg;
                nargs--;
            }
        }

        return args;
    };

    function _is_stack_reg(register) {
        return register && register.indexOf('sp') >= 0;
    }

    /**
     * Indicates whether the current function has a local variable named `name`.
     * @param {string} name A string literal
     * @param {Object} context
     * @returns {boolean}
    var _is_local_var = function(name, context) {
        return context.vars.some(function(v) {
            return (v.name === name);
        });
    };
    */

    var _is_stack_based_local_var = function(name, context) {
        return context.vars.some(function(v) {
            return (v.name === name) && (_is_stack_reg(v.ref.base));
        });
    };

    /**
     * Return a list of the amd64 systemv function call arguments.
     * @param {Array<Object>} instrs Array of instructions preceding the function call
     * @param {number} nargs Number of arguments expected for this function call
     * @param {Object} context Context object (not used)
     * @returns {Array<Variable>} An array of arguments instances, ordered as declared in callee
     */
    var _populate_arm64_call_args = function(instrs, nargs, context) {
        var _regs64 = ['x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6'];
        var _regs32 = ['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6'];

        var armregs = Array.prototype.concat(_regs64, _regs32);

        var args = _regs64.slice(0, nargs);

        // scan the preceding instructions to find where args registers are used, to take their values
        for (var i = (instrs.length - 1);
            (i >= 0) && (nargs > 0); i--) {
            var op = instrs[i].parsed.mnem;
            var opd1 = instrs[i].parsed.opd[0];
            var opd2 = instrs[i].parsed.opd[1];
            //var opd3 = instrs[i].parsed.opd[2];

            if (op == 'pop' || op.indexOf('cb') == 0 || op.indexOf('b') == 0 || op.indexOf('tb') == 0) {
                break;
            }

            // look for an instruction that has two arguments. we assume that such an instruction would use
            // its second operand to set the value of the first. although this is not an accurate observation,
            // it could be used to replace the argument with its value on the arguments list
            if (opd2) {
                var argidx = armregs.indexOf(opd1) % _regs64.length;

                // is destination operand an register argument which has not been considered yet?
                //if ((argidx > (-1)) && (typeof args[argidx] === 'string') && !opd3) {
                //    // take the second operand value, that is likely to be used as the first operand's
                //    // initialization value.
                //    var arg = instrs[i].string ? Variable.string(instrs[i].string) : (Array.isArray(opd2) ? 
                //       Variable.pointer(opd2.join(' + '), _register_size(Math.max(opd2.map(_register_size)))) : Variable.local(opd2, _register_size(opd2)));
                //    instrs[i].valid = false;
                //    args[argidx] = arg;
                //    nargs--;
                //} else {
                var arg = instrs[i].string ? Variable.string(instrs[i].string) : Variable.local(opd1, _register_size(opd1));
                args[argidx] = arg;
                nargs--;
                //}
            }
        }

        return args;
    };

    /**
     * Return a list of the amd64 systemv function call arguments.
     * @param {Array<Object>} instrs Array of instructions preceding the function call
     * @param {number} nargs Number of arguments expected for this function call
     * @param {Object} context Context object (not used)
     * @returns {Array<Variable>} An array of arguments instances, ordered as declared in callee
     */
    var _populate_arm_call_args = function(instrs, nargs, context) {
        var armregs = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'];

        var args = armregs.slice(0, nargs);

        // scan the preceding instructions to find where args registers are used, to take their values
        for (var i = (instrs.length - 1);
            (i >= 0) && (nargs > 0); i--) {
            var op = instrs[i].parsed.mnem;
            var opd1 = instrs[i].parsed.opd[0];
            var opd2 = instrs[i].parsed.opd[1];
            //var opd3 = instrs[i].parsed.opd[2];

            if (op == 'pop' || op.indexOf('cb') == 0 || op.indexOf('b') == 0 || op.indexOf('tb') == 0) {
                break;
            }

            // look for an instruction that has two arguments. we assume that such an instruction would use
            // its second operand to set the value of the first. although this is not an accurate observation,
            // it could be used to replace the argument with its value on the arguments list
            if (opd2) {
                var argidx = armregs.indexOf(opd1) % armregs.length;

                // is destination operand an register argument which has not been considered yet?
                //if ((argidx > (-1)) && (typeof args[argidx] === 'string') && !opd3) {
                //    // take the second operand value, that is likely to be used as the first operand's
                //    // initialization value.
                //    var arg = instrs[i].string ? Variable.string(instrs[i].string) : (Array.isArray(opd2) ? 
                //       Variable.pointer(opd2.join(' + '), _register_size(Math.max(opd2.map(_register_size)))) : Variable.local(opd2, _register_size(opd2)));
                //    instrs[i].valid = false;
                //    args[argidx] = arg;
                //    nargs--;
                //} else {
                var arg = instrs[i].string ? Variable.string(instrs[i].string) : Variable.local(opd1, _register_size(opd1));
                args[argidx] = arg;
                nargs--;
                //}
            }
        }

        return args;
    };

    /**
     * Try to guess the number of arguments passed to a specific cdecl function call, when
     * number of arguments is either unknown or may vary (i.e. like in variadic functions).
     * @param {Array<Object>} instrs Array of instructions preceding the function call
     * @param {Object} context Context object
     * @returns {number} Number of guessed arguments passed in this cdecl function call
     */
    var _guess_cdecl_nargs = function(instrs, context) {
        var nargs = 0;

        // scan preceding instructions backwards, in order to find evidece for passed args
        for (var i = (instrs.length - 1); i >= 0; i--) {
            var mnem = instrs[i].parsed.mnem;
            var opd1 = instrs[i].parsed.opd[0];

            // a "push" instruction which is not the function's prologue indicates
            // that it is probably a function's argument
            if ((mnem.startsWith('st') || mnem.startsWith('ldr') || mnem.startsWith('mov')) && _is_stack_reg(opd1)) {
                nargs++;
            } else if (instrs[i].jump || ((mnem === 'add') && _is_stack_reg(opd1))) {
                // reached the previous function call cleanup, stop searching
                break;
            }
        }

        return nargs;
    };

    function _get_return_value_register(instr, instructions) {
        var start = instructions.indexOf(instr);
        var nextinstr = instructions[start + 1];
        if (['mov r7, r7', 'mov x29, x29'].indexOf(nextinstr.assembly) >= 0) {
            // ObjC marker. two instructions to skip
            nextinstr = instructions[start + 3];
        }
        if (nextinstr) {
            if (nextinstr.parsed.mnem &&
                nextinstr.parsed.mnem.charAt(0) == 'c' &&
                nextinstr.parsed.opd[0] == 'r0') {
                // cbz/cmp
                return 'r0';
            } else if (nextinstr.parsed.opd[1] == 'r0') {
                return 'r0';
            } else if (nextinstr.parsed.opd[2] == 'r0') {
                return 'r0';
            } else if (nextinstr.parsed.mnem &&
                nextinstr.parsed.mnem.charAt(0) == 'c' &&
                nextinstr.parsed.opd[0] == 'w0') {
                // cbz/cmp
                return 'w0';
            } else if (nextinstr.parsed.opd[1] == 'w0') {
                return 'w0';
            } else if (nextinstr.parsed.opd[2] == 'w0') {
                return 'w0';
            } else if (nextinstr.parsed.mnem &&
                nextinstr.parsed.mnem.charAt(0) == 'c' &&
                nextinstr.parsed.opd[0] == 'x0') {
                // cbz/cmp
                return 'x0';
            } else if (nextinstr.parsed.opd[1] == 'x0') {
                return 'x0';
            } else if (nextinstr.parsed.opd[2] == 'x0') {
                return 'x0';
            }
        }
    }

    var _call = function(instr, context, instructions) {
        instr.setBadJump();
        var callname = Extra.replace.call(instr.parsed.opd[0]);
        var returnval = null;
        var args = [];
        var current = instructions.indexOf(instr);
        var regnum = 3;

        var callee = instr.callee;


        if (ObjC.is(callname)) {
            var pargs, receiver, selector, pcounted = 0;
            if (!ObjC.is_class_method(callname)) {
                return ObjC.handle_others(callname, instr, context, instructions);
            } else {
                receiver = ObjC.receiver(callname);
                selector = ObjC.selector(callname);
                returnval = ObjC.returns(callname);
                pargs = ObjC.arguments(callname);
                var subslice = instructions.slice((start - 8) < 0 ? 0 : start - 8, start);
                args = [receiver, selector].map(function(reg) {
                    var marker = context.markers[instr.marker];
                    if (marker && marker[reg]) {
                        marker[reg].instr.valid = false;
                        var bits = Global.evars.archbits > 32 ? 64 : 32;
                        var vtype = marker[reg].instr.parsed.mnem.startsWith('ld') ? 'pointer' : 'local';
                        var ret = marker[reg].instr.string ?
                            marker[reg].instr.string :
                            Variable[vtype]('0x' + marker[reg].value.toString(16), Extra.to.type(bits, false));
                        delete marker[reg];
                        return ret;
                    }
                    for (var i = subslice.length - 1; i >= 0; i--) {
                        if (subslice[i].parsed.mnem.startsWith('b') || subslice[i].jump) {
                            break;
                        }
                        if (reg == subslice[i].parsed.opd[0] && "mov" == subslice[i].parsed.mnem) {
                            subslice[i].valid = false;
                            var opd2 = subslice[i].parsed.opd[1];
                            if (opd2.startsWith('str.') && !subslice[i].string) {
                                return opd2.substr(4);
                            }
                            return subslice[i].string ?
                                Variable.string(subslice[i].string) :
                                Variable.local(opd2, Extra.to.type(null, false));
                        }
                    }
                    return reg;
                });
                for (j = 0; j < pargs.length; j++) {
                    //seen = [];
                    for (i = subslice.length - 1; i >= 0; i--) {
                        if (subslice[i].parsed.mnem.startsWith('b') || subslice[i].jump) {
                            break;
                        }
                        if (pargs[j] == subslice[i].parsed.opd[0]) {
                            if (subslice[i].parsed.mnem == "mov") {
                                var opd2 = subslice[i].parsed.opd[1];
                                if (opd2.startsWith('str.') && !subslice[i].string) {
                                    pargs[j] = opd2.substr(4);
                                } else {
                                    pargs[j] = subslice[i].string ?
                                        Variable.string(subslice[i].string) :
                                        Variable.local(opd2, Extra.to.type(null, false));
                                }
                                subslice[i].valid = false;
                            }
                            pcounted++;
                            break;
                        }
                    }
                }
                var call = Base.objc_call(args[0], args[1], pargs.slice(0, pcounted));
                if (current == instructions.length - 1) {
                    // ControlFlow does not interpret well the specific case of a tail jmp through
                    // a register. in this case, we will need to emit an explicit return statement
                    return Base.return(call);
                } else if (returnval) {
                    // if return value is used, assign it. otherwise just emit the call
                    return Base.assign(returnval, call);
                }
            }
        } else if (callee) {
            var populate_call_args = {
                'cdecl': _populate_cdecl_call_args,
                'arm32': _populate_arm_call_args,
                'arm64': _populate_arm64_call_args
            }[callee.calltype];

            // every non-import callee has a known number of arguments
            // for imported libc functions, get the number of arguments out of a predefined list
            var nargs = callee.name.startsWith('sym.') ?
                Extra.find.arguments_number(callee.name) :
                callee.nargs;

            // if number of arguments is unknown (either an unrecognized or a variadic function),
            // try to guess the number of arguments
            if (nargs == (-1) && callee.calltype == 'cdecl') {
                nargs = _guess_cdecl_nargs(instructions.slice(0, current), context);
            } else if (nargs == (-1)) {
                nargs = 0;
            }
            args = populate_call_args(instructions.slice(0, current), nargs, context);
            if (nargs > 0) {
                args = args.slice(0, nargs);
            }
        } else {
            var known_args_n = Extra.find.arguments_number(callname);
            if (known_args_n == 0) {
                return Base.call(callname, args);
            } else if (known_args_n > 0) {
                regnum = known_args_n - 1;
            }
            var i, op, reg, reg32, reg64, start, arg0 = null;
            start = current;
            for (i = start - 1; i >= 0 && regnum >= 0; i--) {
                op = instructions[i].parsed.mnem;
                if (!op) {
                    break;
                }
                arg0 = instructions[i].parsed.opd[0];
                reg = 'r' + regnum;
                reg32 = 'w' + regnum;
                reg64 = 'x' + regnum;
                if (op == 'pop' || op.indexOf('cb') == 0 || op.indexOf('b') == 0 || op.indexOf('tb') == 0) {
                    regnum--;
                    i = start;
                } else if (arg0 == reg || arg0 == reg32 || arg0 == reg64) {
                    args.unshift(_fix_arg(instructions[i]));
                    regnum--;
                    i = start;
                }
            }
            if (args.length < 1) {
                start = current;
                for (i = 0; start >= 0 && i < 8; start--, i++) {
                    op = instructions[i].parsed.mnem;
                    if (!op) {
                        break;
                    }
                    if (op == 'pop' || op.indexOf('cb') == 0 || op.indexOf('b') == 0) {
                        break;
                    }
                    if (arg0 == reg || arg0 == reg32 || arg0 == reg64) {
                        break;
                    }
                }
                regnum = 0;
                for (i = start; i < current; i++) {
                    op = instructions[i].parsed.mnem;
                    if (!op) {
                        break;
                    }
                    arg0 = instructions[i].parsed.opd[0];
                    reg = 'r' + regnum;
                    reg32 = 'w' + regnum;
                    reg64 = 'x' + regnum;
                    if (arg0 == reg || arg0 == reg32 || arg0 == reg64) {
                        args.unshift(_fix_arg(instructions[i]));
                        regnum++;
                        i = start;
                    }
                }
            }
        }

        returnval = _get_return_value_register(instr, instructions);

        if (callname.match(/^[rwx]\d+$/) || callname.match(/^0x[a-fA-F\d]+$/)) {
            callname = Variable.functionPointer(callname, _reg_bits[callname[0]] || 0, args);
        }

        if (returnval) {
            return Base.assign(returnval, Base.call(callname, args));
        }
        return Base.call(callname, args);
    };

    var _arm_conditional_execution = function(condition, p) {
        var f = function(instr, context, instructions) {
            _conditional_inline(instr, context, instructions, arguments.callee.condition);
            return arguments.callee.instruction(instr, context, instructions);
        };
        f.condition = condition;
        f.instruction = p;
        return f;
    };

    var _arm_conditional_bit = function(p) {
        var f = function(instr, context, instructions) {
            _compare(instr, context);
            return arguments.callee.instruction(instr, context, instructions);
        };
        f.instruction = p;
        return f;
    };

    var _it_to_boolean_array = function(value) {
        return value == 't' ? true : false;
    };

    var _conditional_instruction_list = [
        'add', 'and', 'eor', 'ldr', 'ldrb', 'ldm', 'lsl', 'lsr',
        'mov', 'mvn', 'mul', 'orr', 'pop', 'str', 'strb', 'sub', 'bx'
    ];

    var _arm = {
        instructions: {
            add: function(instr, context, instructions) {
                var marker = _apply_marker_math(instr, context);
                if (marker) {
                    return marker;
                }
                return _common_math(instr.parsed, Base.add);
            },
            adr: function(instr) {
                var dst = instr.parsed.opd[0];
                return Base.assign(dst, instr.parsed.opd[1]);
            },
            adrp: function(instr, context) {
                var marker = _apply_marker_math(instr, context);
                if (marker) {
                    return marker;
                }
                var dst = instr.parsed.opd[0];
                return Base.assign(dst, instr.parsed.opd[1]);
            },
            and: function(instr) {
                return _common_math(instr.parsed, Base.and);
            },
            clz: function(instr) {
                return _common_math(instr.parsed, Base.and);
            },
            b: function() {
                return Base.nop();
            },
            br: function(instr, context, instructions) {
                var callname = instr.parsed.opd[0];
                instr.setBadJump();
                callname = Variable.functionPointer(callname, _reg_bits[callname[0]] || 0, []);
                if (instructions[instructions.length - 1] == instr) {
                    return Base.return(Base.call(callname, []));
                }
                return Base.call(callname, []);
            },
            bx: function(instr, context, instructions) {
                var callname = instr.parsed.opd[0];
                if (callname == 'lr') {
                    var start = instructions.indexOf(instr);
                    var returnval = null;
                    if (instructions[start - 1].parsed.opd[1] == 'r0') {
                        returnval = 'r0';
                    }
                    return Base.return(returnval);
                }
                instr.setBadJump();
                callname = Variable.functionPointer(callname, _reg_bits[callname[0]] || 0, []);
                return Base.return(Base.call(callname, []));
            },
            bpl: function(instr, context) {
                return _conditional(instr, context, 'GE');
            },
            bls: function(instr, context) {
                return _conditional(instr, context, 'LT');
            },
            bmi: function(instr, context) {
                return _conditional(instr, context, 'LT');
            },
            bne: function(instr, context) {
                return _conditional(instr, context, 'NE');
            },
            beq: function(instr, context) {
                return _conditional(instr, context, 'EQ');
            },
            bgt: function(instr, context) {
                return _conditional(instr, context, 'GT');
            },
            bhi: function(instr, context) {
                return _conditional(instr, context, 'GT');
            },
            bhs: function(instr, context) {
                return _conditional(instr, context, 'GE');
            },
            bge: function(instr, context) {
                return _conditional(instr, context, 'GE');
            },
            blt: function(instr, context) {
                return _conditional(instr, context, 'LT');
            },
            ble: function(instr, context) {
                return _conditional(instr, context, 'LE');
            },
            blo: function(instr, context) {
                return _conditional(instr, context, 'LE');
            },
            'b.pl': function(instr, context) {
                return _conditional(instr, context, 'GE');
            },
            'b.ls': function(instr, context) {
                return _conditional(instr, context, 'LT');
            },
            'b.lt': function(instr, context) {
                return _conditional(instr, context, 'LT');
            },
            'b.ne': function(instr, context) {
                return _conditional(instr, context, 'NE');
            },
            'b.eq': function(instr, context) {
                return _conditional(instr, context, 'EQ');
            },
            'b.lo': function(instr, context) {
                return _conditional(instr, context, 'LO');
            },
            'b.hi': function(instr, context) {
                return _conditional(instr, context, 'GT');
            },
            'b.hs': function(instr, context) {
                return _conditional(instr, context, 'GE');
            },
            'b.ge': function(instr, context) {
                return _conditional(instr, context, 'GE');
            },
            'b.gt': function(instr, context) {
                return _conditional(instr, context, 'GT');
            },
            eon: function(instr) {
                return Base.composed([
                    _common_math(instr.parsed, Base.xor),
                    Base.not(instr.parsed.opd[0], instr.parsed.opd[0])
                ]);
            },
            eor: function(instr) {
                return _common_math(instr.parsed, Base.xor);
            },
            bl: _call,
            blx: _call,
            cmp: _compare,
            cmn: _compare,
            fcmp: _compare,
            cbz: function(instr, context, instructions) {
                context.cond.a = instr.parsed.opd[0];
                context.cond.b = '0';
                return _conditional(instr, context, 'EQ');
            },
            cbnz: function(instr, context, instructions) {
                context.cond.a = instr.parsed.opd[0];
                context.cond.b = '0';
                return _conditional(instr, context, 'NE');
            },
            ldr: function(instr, context) {
                var marker = _apply_marker_math(instr, context);
                if (marker) {
                    return marker;
                }
                return _memory(Base.read_memory, instr, '32');
            },
            ldur: function(instr) {
                return _memory(Base.read_memory, instr, '32');
            },
            ldrh: function(instr) {
                return _memory(Base.read_memory, instr, '16');
            },
            ldrb: function(instr) {
                return _memory(Base.read_memory, instr, '8');
            },
            ldrsr: function(instr) {
                return _memory(Base.read_memory, instr, '32', true);
            },
            ldrsh: function(instr) {
                return _memory(Base.read_memory, instr, '16', true);
            },
            ldrsb: function(instr) {
                return _memory(Base.read_memory, instr, '8', true);
            },
            ldm: function(instr) {
                for (var i = 1; i < instr.parsed.length; i++) {
                    if (instr.parsed.opd[i] == 'pc') {
                        return Base.return();
                    }
                }
                instr.comments.push(instr.opcode);
                return Base.nop();
            },
            lsl: function(instr) {
                return _common_math(instr.parsed, Base.shift_left);
            },
            lsr: function(instr) {
                return _common_math(instr.parsed, Base.shift_right);
            },
            asls: function(instr) {
                return _common_math(instr.parsed, Base.shift_left);
            },
            asrs: function(instr) {
                return _common_math(instr.parsed, Base.shift_right);
            },
            msr: function(instr) {
                return Base.assign(instr.parsed.opd[0], instr.parsed.opd[1]);
            },
            mrs: function(instr) {
                return Base.assign(instr.parsed.opd[0], instr.parsed.opd[1]);
            },
            mov: function(instr) {
                var dst = instr.parsed.opd[0];
                var src = instr.parsed.opd[1];
                if (dst == 'ip' || dst == 'sp' || dst == 'fp') {
                    return Base.nop();
                }
                if (_zero_regs.indexOf(src) >= 0) {
                    src = Variable.number('0');
                }
                return Base.assign(dst, src);
            },
            movt: function(instr, context, instructions) {
                var marker = _apply_marker_math(instr, context);
                if (marker) {
                    return marker;
                }
                var pos = instructions.indexOf(instr);
                var dst = instr.parsed.opd[0];
                var src = parseInt(instr.parsed.opd[1]);
                if (dst == 'ip' || dst == 'sp' || dst == 'fp') {
                    return Base.nop();
                }
                if (instr.parsed.opd[1] == 0) {
                    instr.parsed = ['nop'];
                    return Base.nop();
                }
                if (instructions[pos - 1] && instructions[pos - 1].parsed.opd[0] == dst) {
                    var src1 = parseInt(instructions[pos - 1].parsed.opd[1]);
                    instructions[pos - 1].valid = false;
                    return Base.assign(dst, '0x' + ((src << 16) + src1).toString(16));
                }
                return Base.special(dst + ' = (' + dst + ' & 0xFFFF) | 0x' + src.toString(16) + '0000');
            },
            movw: function(instr, context) {
                var marker = _apply_marker_math(instr, context);
                if (marker) {
                    return marker;
                }
                var dst = instr.parsed.opd[0];
                if (dst == 'ip' || dst == 'sp' || dst == 'fp') {
                    return Base.nop();
                }
                if (instr.string) {
                    return Base.assign(dst, Variable.string(instr.string));
                }
                if (instr.parsed.opd[1] == '0') {
                    instr.parsed = ['nop'];
                    return Base.nop();
                }
                return Base.special(dst + ' = (' + dst + ' & 0xFFFF0000) | (' + instr.parsed.opd[1] + ' & 0xFFFF)');
            },
            movz: function(instr) {
                var dst = instr.parsed.opd[0];
                return Base.assign(dst, instr.parsed.opd[1]);
            },
            mvn: function(instr) {
                var dst = instr.parsed.opd[0];
                if (dst == 'ip' || dst == 'sp' || dst == 'fp') {
                    return Base.nop();
                }
                return Base.not(dst, instr.parsed.opd[1]);
            },
            mul: function(instr) {
                return _common_math(instr.parsed, Base.multiply);
            },
            nop: function(instr) {
                return Base.nop();
            },
            orr: function(instr) {
                if (_zero_regs.indexOf(instr.parsed.opd[1]) >= 0) {
                    return Base.assign(instr.parsed.opd[0], instr.parsed.opd[2] || '0');
                }
                return _common_math(instr.parsed, Base.or);
            },
            pop: function(instr) {
                for (var i = 1; i < instr.parsed.length; i++) {
                    if (instr.parsed.opd[i] == 'pc') {
                        return Base.return();
                    }
                }
                return null;
            },
            popeq: function(instr, context, instructions) {
                for (var i = 1; i < instr.parsed.length; i++) {
                    if (instr.parsed.opd[i] == 'pc') {
                        _conditional_inline(instr, context, instructions, 'EQ');
                        return Base.return();
                    }
                }
                return null;
            },
            popne: function(instr, context, instructions) {
                for (var i = 1; i < instr.parsed.length; i++) {
                    if (instr.parsed.opd[i] == 'pc') {
                        _conditional_inline(instr, context, instructions, 'NE');
                        return Base.return();
                    }
                }
                return null;
            },
            push: function() {},
            'push.w': function() {},
            ror: function(instr) {
                return Base.rotate_right(instr.parsed.opd[0], instr.parsed.opd[1], parseInt(instr.parsed.opd[2], 16).toString(), 32);
            },
            rol: function(instr) {
                return Base.rotate_left(instr.parsed.opd[0], instr.parsed.opd[1], parseInt(instr.parsed.opd[2], 16).toString(), 32);
            },
            ret: function(instr, context, instructions) {
                var start = instructions.indexOf(instr);
                var returnval = null;
                if (instructions[start - 1].parsed.opd[1] == 'x0') {
                    returnval = 'x0';
                }
                return Base.return(returnval);
            },
            stp: function(instr) {
                var e = instr.parsed.opd;
                var bits = _reg_bits[e[0][0]] || 64;
                return Base.composed([
                    Base.write_memory(e[2].join(' + '), e[0], bits, false),
                    Base.write_memory(e[2].concat([(bits / 8)]).join(' + '), e[1], bits, false)
                ]);
            },
            ldp: function(instr) {
                var e = instr.parsed.opd;
                var bits = _reg_bits[e[0][0]] || 64;
                return Base.composed([
                    Base.read_memory(e[2].join(' + '), e[0], bits, false),
                    Base.read_memory(e[2].concat([(bits / 8)]).join(' + '), e[1], bits, false)
                ]);
            },
            str: function(instr) {
                return _memory(Base.write_memory, instr, 32);
            },
            strb: function(instr) {
                return _memory(Base.write_memory, instr, 8);
            },
            strh: function(instr) {
                return _memory(Base.write_memory, instr, 8);
            },
            sub: function(instr) {
                return _common_math(instr.parsed, Base.subtract);
            },
            rsb: function(instr) {
                var op = Base.subtract;
                var e = instr.parsed;
                if (e.opd[0] == 'ip' || e.opd[0] == 'sp' || e.opd[0] == 'fp') {
                    return Base.nop();
                }
                if (e.opd.length == 3) {
                    return op(e.opd[0], e.opd[2], e.opd[1]);
                }
                if (_operands[e.opd[3]]) {
                    e.opd[3] = _operands[e.opd[3]];
                }
                return op(e.opd[0], '(' + e.slice(3).join(' ') + ')', e.opd[1]);
            },
            ubfx: function(instr) {
                //UBFX dest, src, lsb, width
                var dest = instr.parsed.opd[0];
                var src = instr.parsed.opd[1];
                var lsb = instr.parsed.opd[2];
                var width = instr.parsed.opd[3];
                return Base.special(dest + ' = ' + '(' + src + ' >> ' + lsb + ') & ((1 << ' + width + ') - 1)');
            },
            uxtb: function(instr) {
                return Base.cast(instr.parsed.opd[0], instr.parsed.opd[1], Extra.to.type(8, true));
            },
            uxth: function(instr) {
                return Base.cast(instr.parsed.opd[0], instr.parsed.opd[1], Extra.to.type(16, true));
            },
            /* ARM64 */
            blr: _call,
            bic: function(instr, context, instructions) {
                return Base.bit_mask(instr.parsed.opd[0], instr.parsed.opd[1], instr.parsed.opd[2]);
            },
            bfc: function(instr, context, instructions) {
                var arg0 = Variable.uniqueName();
                return Base.composed([
                    Base.bit_mask(arg0, instr.parsed.opd[2], instr.parsed.opd[3]),
                    Base.not(arg0, arg0),
                    Base.and(instr.parsed.opd[0], instr.parsed.opd[0], arg0),
                ]);
            },
            bfi: function(instr, context, instructions) {
                /*
                    BFI R9, R2, #8, #12; 
                    Replace bit 8 to bit 19 (12 bits) of R9 with bit 0 to bit 11 from R2.
                */
                var arg0 = Variable.uniqueName();
                var arg1 = Variable.uniqueName();
                return Base.composed([
                    Base.bit_mask(arg0, instr.parsed.opd[2], instr.parsed.opd[3]),
                    Base.and(arg1, instr.parsed.opd[1], arg0),
                    Base.not(arg0, arg0),
                    Base.and(instr.parsed.opd[0], instr.parsed.opd[0], arg0),
                    Base.or(instr.parsed.opd[0], instr.parsed.opd[0], arg1),
                ]);
            },
            bfxil: function(instr, context, instructions) {
                var opds = instr.parsed.opd;
                var lsb = parseInt(opds[2]);
                var width = parseInt(opds[3]);
                var bits = _reg_bits[opds[0][0]] || 32;
                var mask_A = Long.MAX_UNSIGNED_VALUE.shl(lsb + width);
                var mask_B = mask_A.not();

                if (bits < 64) {
                    mask_A = mask_A.and(0xffffffff);
                    mask_B = mask_B.and(0xffffffff);
                }
                var sp = opds[0] + ' = (uint' + bits + '_t) (' + opds[0] + ' & 0x' + mask_A.toString(16);
                sp += ') | (' + opds[1] + ' & 0x' + mask_B.toString(16) + ')';
                return Base.special(sp);
            },
            csel: function(instr, context) {
                var opds = instr.parsed.opd;
                var cond = 'EQ';
                for (var i = 0; i < _conditional_list.length; i++) {
                    if (_conditional_list[i].ext == opds[3]) {
                        cond = _conditional_list[i].type;
                        break;
                    }
                }
                return Base.conditional_assign(opds[0], context.cond.a, context.cond.b, cond, opds[1], opds[2]);
            },
            cset: function(instr, context) {
                var opds = instr.parsed.opd;
                var cond = 'EQ';
                for (var i = 0; i < _conditional_list.length; i++) {
                    if (_conditional_list[i].ext == opds[1]) {
                        cond = _conditional_list[i].type;
                        break;
                    }
                }
                return Base.conditional_assign(opds[0], context.cond.a, context.cond.b, cond, 1, 0);
            },
            csinc: function(instr, context) {
                var opds = instr.parsed.opd;
                var cond = 'EQ';
                for (var i = 0; i < _conditional_list.length; i++) {
                    if (_conditional_list[i].ext == opds[3]) {
                        cond = _conditional_list[i].type;
                        break;
                    }
                }
                return Base.conditional_assign(opds[0], context.cond.a, context.cond.b, cond, opds[1], opds[2] + " + 1");
            },
            orn: function(instr) {
                var opds = instr.parsed.opd;
                var ops = [];
                ops.push(Base.or(opds[0], opds[1], opds[2]));
                ops.push(Base.not(opds[0], opds[0]));
                return Base.composed(ops);
            },
            neg: function(instr) {
                var dst = instr.parsed.opd[0];
                if (dst == 'ip' || dst == 'sp' || dst == 'fp') {
                    return Base.nop();
                }
                return Base.negate(dst, instr.parsed.opd[1]);
            },
            movi: function(instr) {
                var opds = instr.parsed.opd;
                var val = Long.fromString(opds[1], true, opds[1].indexOf('0x') == 0 ? 16 : 10);
                return Base.assign(opds[0], '0x' + val.toString(16));
            },
            movn: function(instr) {
                var opds = instr.parsed.opd;
                var val = Long.fromString(opds[1], true, opds[1].indexOf('0x') == 0 ? 16 : 10);
                if (instr.parsed.opd.length == 2) {
                    return Base.assign(opds[0], '0x' + val.toString(16));
                }
                val = val.shl(parseInt(opds[3]));
                return Base.assign(opds[0], '0x' + val.toString(16));
            },
            movk: function(instr) {
                var opds = instr.parsed.opd;
                var ops = [];
                var val = Long.fromString(opds[1], true, opds[1].indexOf('0x') == 0 ? 16 : 10);
                var mask = Long.fromValue(0xffff, true);


                if (instr.parsed.opd.length != 2) {
                    var shift = parseInt(opds[3]);
                    mask = mask.shl(shift);
                    val = val.shl(shift);
                }
                mask = mask.not();

                if (opds[0][0] == 'w') {
                    mask = mask.and(0xffffffff);
                }

                ops.push(Base.and(opds[0], opds[0], '0x' + mask.toString(16)));
                if (parseInt(opds[1]) == 0) {
                    return ops[0];
                }
                ops.push(Base.or(opds[0], opds[0], '0x' + val.toString(16)));
                return Base.composed(ops);
            },
            ldrw: function(instr) {
                return _memory(Base.read_memory, instr, '64', true);
            },
            ldrsw: function(instr) {
                return _memory(Base.read_memory, instr, '64', true);
            },
            rev: function(instr) {
                return Base.swap_endian(instr.parsed.opd[0], instr.parsed.opd[1], _reg_bits[instr.parsed.opd[0][0]]);
            },
            tst: function(instr, context) {
                var a = instr.parsed.opd[0];
                var b = instr.parsed.opd[1];
                context.cond.a = (a === b) ? a : '(' + a + ' & ' + b + ')';
                context.cond.b = '0';
            },
            tbnz: function(instr, context) {
                var a = instr.parsed.opd[0];
                var b = instr.parsed.opd[1];
                context.cond.a = (a === b) ? a : '(' + a + ' & ' + b + ')';
                context.cond.b = '0';
                return _conditional(instr, context, 'NE');
            },
            sxtw: function(instr) {
                var a = instr.parsed.opd[0];
                var b = instr.parsed.opd[1];
                return Base.cast(a, b, Extra.to.type(_reg_bits[a[0]], true));
            },
            udiv: function(instr) {
                return _common_math(instr.parsed, Base.divide);
            },
            sdiv: function(instr) {
                return _common_math(instr.parsed, Base.divide);
            },
            ubfiz: function(instr) {
                var opds = instr.parsed.opd;
                var arg = Variable.uniqueName();
                var shift = parseInt(opds[2]);
                var width = parseInt(opds[3]);
                var bits = _reg_bits[opds[0][0]] || 32;
                var rc = bits - width;
                var lc = rc - shift;
                return Base.composed([
                    Base.shift_right(arg, opds[1], '0x' + lc.toString(16)),
                    Base.shift_left(opds[0], arg, '0x' + lc.toString(16))
                ]);
            },
            sbfiz: function(instr) {
                var opds = instr.parsed.opd;
                var arg = Variable.uniqueName();
                var shift = parseInt(opds[2]);
                var width = parseInt(opds[3]);
                var bits = _reg_bits[opds[0][0]] || 32;
                var rc = bits - width;
                var lc = rc - shift;
                return Base.composed([
                    Base.shift_right(arg, opds[1], '0x' + lc.toString(16)),
                    Base.shift_left(opds[0], arg, '0x' + lc.toString(16)),
                    Base.cast(opds[0], opds[0], Extra.to.type(bits, true)),
                ]);
            },
            it: function(instr, context, instructions) {
                var table = instr.parsed.opd[0].split('').map(_it_to_boolean_array);
                var cond = instr.parsed.opd[1];
                var pos = instructions.indexOf(instr) + 1;
                var type = _conditional_list.filter(function(x) {
                    if (x.ext == cond.toLowerCase()) {
                        return true;
                    }
                    return false;
                })[0].type;
                var invert = _conditional_list_inv[type];
                for (var i = 0; i < table.length; i++) {
                    _conditional_inline(instructions[pos + i], context, instructions, table[i] ? invert : type);
                }
                return Base.nop();
            },
            /* SIMD/FP */
            stur: function(instr) {
                return _memory(Base.write_memory, instr, _reg_bits[instr.parsed.opd[0][0]]);
            },
            sturh: function(instr) {
                return _memory(Base.write_memory, instr, _reg_bits[instr.parsed.opd[0][0]]);
            },
            invalid: function() {
                return Base.nop();
            }
        },
        parse: function(asm) {
            var ret = asm.replace(/(\[|\])/g, ' $1 ').replace(/,/g, ' ');
            ret = ret.replace(/\{|\}/g, ' ').replace(/#/g, ' ');
            ret = ret.replace(/\s+/g, ' ');
            ret = ret.replace(/str\./g, 'str_');
            //constant zero regs wz[rw]/xz[rw]
            //ret = ret.replace(/\bwzr\b|\bwzw\b|\bxzw|\bxzr\b/g, "0");
            ret = ret.replace(/aav\.0x/g, "aav_");
            ret = ret.replace(/-\s/g, "-").trim().split(' ');
            var ops = [ret[0]];
            for (var i = 1, mem = false, mops = []; i < ret.length; i++) {
                if (mem && ret[i] == "+") {
                    continue;
                } else if (ret[i] == "[") {
                    mem = true;
                } else if (ret[i] == "]") {
                    mem = false;
                    ops.push(mops);
                    mops = [];
                } else if (mem) {
                    if (ret[i].match(/^[su]xtw$/) && ret[i] == ']') {
                        continue;
                    }
                    mops.push(ret[i]);
                } else {
                    ops.push(ret[i]);
                }
            }
            if (ops[0].startsWith('it')) {
                ops.splice(1, 0, 't' + ops[0].substr(2));
                ops[0] = ops[0].substr(0, 2);
                console.log(ops[0], ops[1]);
            }
            return {
                mnem: ops.shift().replace(/\.w$/, ''),
                opd: ops
            };
        },
        context: function(data) {
            var fcnargs = data.xrefs.arguments;

            var vars_args = Array.prototype.concat(fcnargs.bp, fcnargs.sp, fcnargs.reg).map(function(x) {
                if (x.type === 'int' || x.type === 'signed int') {
                    x.type = 'int32_t';
                } else if (x.type === 'unsigned int') {
                    x.type = 'uint32_t';
                }
                return x;
            });
            return {
                markers: {},
                cond: {
                    a: '?',
                    b: '?'
                },
                leave: false,
                vars: vars_args.filter(function(e) {
                    return (e.kind === 'var');
                }) || [],
                args: vars_args.filter(function(e) {
                    return (e.kind === 'arg' || e.kind === 'reg');
                }) || []
            };
        },
        globalvars: function(context) {
            return [];
        },
        localvars: function(context) {
            return context.vars.map(function(v) {
                return v.type + ' ' + v.name;
            });
        },
        postanalisys: function(instructions, context) {
            for (var k in context.markers) {
                var m = context.markers[k];
                for (var reg in m) {
                    _apply_new_assign(reg, m[reg]);
                }
            }
        },
        arguments: function(context) {
            return [];
        },
        returns: function(context) {
            return 'void';
        }
    };

    function _apply_new_assign(register, data) {
        if (data) {
            if (data.instr.string) {
                data.instr.code = Base.assign(data.instr.parsed.opd[0], Variable.string(data.instr.string));
            } else if (data.instr.symbol) {
                data.instr.code = Base.assign(data.instr.parsed.opd[0], data.instr.symbol);
            } else if (data.instr.parsed.mnem.startsWith('ld')) {
                data.instr.code = Base.read_memory('0x' + data.value.toString(16), data.instr.parsed.opd[0], 32, false);
            } else {
                data.instr.code = Base.assign(register, '0x' + data.value.toString(16));
            }
        }
    }

    var _value_at = function(address) {
        if (r2cmd) {
            //this is truly an hack
            var bytes = Global.evars.archbits > 32 ? 8 : 4;
            var p = JSON.parse(r2cmd('pxj ' + bytes + ' @ 0x' + address.toString(16)).trim()).reverse().map(function(x) {
                x = x.toString(16);
                return x.length > 1 ? x : '0' + x;
            }).join('');
            return Long.fromString(p, true, 16);
        }
        return null;
    };

    function _apply_marker_math(instr, context) {
        if (!context.markers[instr.marker]) {
            context.markers[instr.marker] = {};
        }
        var m = context.markers[instr.marker];
        if (_apply_math[instr.parsed.mnem]) {
            _apply_math[instr.parsed.mnem](m, instr, context);
        }
        return instr.code;
    }

    var _apply_math = {
        adrp: function(marker, instr) {
            _apply_new_assign(instr.parsed.opd[0], marker[instr.parsed.opd[0]]);
            marker[instr.parsed.opd[0]] = {
                value: Long.fromString(instr.parsed.opd[1], true, 16),
                instr: instr,
            };
        },
        movw: function(marker, instr) {
            var s = parseInt(instr.parsed.opd[1]);
            _apply_new_assign(instr.parsed.opd[0], marker[instr.parsed.opd[0]]);
            marker[instr.parsed.opd[0]] = {
                value: Long.fromString(s.toString(16), true, 16),
                instr: instr,
            };
        },
        movt: function(marker, instr) {
            if (!marker[instr.parsed.opd[0]]) {
                return;
            }
            var s = parseInt(instr.parsed.opd[1]);
            var v = marker[instr.parsed.opd[0]].value;
            var i = marker[instr.parsed.opd[0]].instr;
            i.valid = false;
            marker[instr.parsed.opd[0]].instr = instr;
            marker[instr.parsed.opd[0]].value = v.or(Long.fromString(s.toString(16) + '0000', true, 16));
        },
        add: function(marker, instr) {
            if (!marker[instr.parsed.opd[0]] || instr.parsed.opd[1] != 'pc' || instr.parsed.opd.length != 2) {
                return;
            }
            var v = marker[instr.parsed.opd[0]].value;
            var i = marker[instr.parsed.opd[0]].instr;
            i.valid = false;
            marker[instr.parsed.opd[0]].instr = instr;
            marker[instr.parsed.opd[0]].value = v.add(instr.location).add(4);
        },
        ldr: function(marker, instr) {
            if (Array.isArray(instr.parsed.opd[1]) && !marker[instr.parsed.opd[1][0]]) {
                return;
            } else if (!Array.isArray(instr.parsed.opd[1]) && !marker[instr.parsed.opd[1]]) {
                return;
            }
            var data = marker[instr.parsed.opd[1]] || marker[instr.parsed.opd[1][0]];
            if (instr.parsed.opd[0] == instr.parsed.opd[1] || instr.parsed.opd[0] == instr.parsed.opd[1][0]) {
                data.instr.valid = false;
            }
            var number = data.value.add(Long.UZERO);
            if (Array.isArray(instr.parsed.opd[1]) && instr.parsed.opd[1][1]) {
                number = number.add(Long.fromString(instr.parsed.opd[1][1], true, 16));
            }

            var v = _value_at(number);
            instr.string = Global.xrefs.find_string(v) || Global.xrefs.find_string(number);
            instr.symbol = Global.xrefs.find_symbol(v) || Global.xrefs.find_symbol(number);
            if (instr.string) {
                instr.code = Base.assign(instr.parsed.opd[0], Variable.string(instr.string));
            } else if (instr.symbol) {
                instr.code = Base.assign(instr.parsed.opd[0], instr.symbol);
            } else {
                instr.code = Base.read_memory('0x' + number.toString(16), instr.parsed.opd[0], 32, false);
            }
            _apply_new_assign(instr.parsed.opd[0], marker[instr.parsed.opd[0]]);
            marker[instr.parsed.opd[0]] = {
                value: number,
                instr: instr,
            };
        }
    };

    var _conditional_list_inv = {
        'LT': 'GE',
        'LE': 'GT',
        'GT': 'LE',
        'GE': 'LT',
        'EQ': 'NE',
        'NE': 'EQ',
        'LO': 'NO',
        'NO': 'LO',
    };

    var _conditional_list = [{
        type: 'LT',
        ext: 'lt'
    }, {
        type: 'LT',
        ext: 'mi'
    }, {
        type: 'LT',
        ext: 'cc'
    }, {
        type: 'LT',
        ext: 'lo'
    }, {
        type: 'LE',
        ext: 'ls'
    }, {
        type: 'LE',
        ext: 'le'
    }, {
        type: 'GT',
        ext: 'gt'
    }, {
        type: 'GT',
        ext: 'hi'
    }, {
        type: 'GE',
        ext: 'ge'
    }, {
        type: 'GE',
        ext: 'hs'
    }, {
        type: 'GE',
        ext: 'cs'
    }, {
        type: 'GE',
        ext: 'pl'
    }, {
        type: 'EQ',
        ext: 'eq'
    }, {
        type: 'NE',
        ext: 'ne'
    }, {
        type: 'LO',
        ext: 'lo'
    }];

    for (var i = 0; i < _conditional_instruction_list.length; i++) {
        var e = _conditional_instruction_list[i];
        var p = _arm.instructions[e];
        for (var j = 0; j < _conditional_list.length; j++) {
            var c = _conditional_list[j];
            if (!_arm.instructions[e + c.ext]) {
                _arm.instructions[e + c.ext] = _arm_conditional_execution(c.type, p);
            }
        }
        if (!_arm.instructions[e + 's']) {
            _arm.instructions[e + 's'] = _arm_conditional_bit(p);
        }
        if (!_arm.instructions[e + '.w']) {
            _arm.instructions[e + '.w'] = p;
        }
    }
    return _arm;
})();