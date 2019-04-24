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
	const Extra = require('libdec/core/extra');

	const _x86_stret = {
		'32': {
			returns: 'rdi',
			receiver: 'eax',
			selector: 'ecx',
			args: ['edx', 'ecx', 'r8d', 'r9d']
		},
		'64': {
			returns: 'rdi',
			receiver: 'rsi',
			selector: 'rdx',
			args: ['rcx', 'r8', 'r9', 'r10']
		}
	};

	const _x86 = {
		'32': {
			receiver: 'eax',
			selector: 'ecx',
			returns: 'eax',
			args: ['edx', 'ecx', 'r8d', 'r9d']
		},
		'64': {
			receiver: 'rdi',
			selector: 'rsi',
			returns: 'rax',
			args: ['rdx', 'rcx', 'r8', 'r9']
		}
	};

	const _ppc = {
		receiver: 'r3',
		selector: 'r4',
		returns: 'r3',
		args: ['r5', 'r6', 'r7', 'r8']
	};

	const _ppc_stret = {
		returns: 'r3',
		receiver: 'r4',
		selector: 'r5',
		args: ['r6', 'r7', 'r8', 'r9']
	};

	const _arm = {
		'32': {
			receiver: 'r0',
			selector: 'r1',
			returns: 'r0',
			args: ['r2', 'r3', 'r4', 'r5']
		},
		'64': {
			receiver: 'x0',
			selector: 'x1',
			returns: 'x0',
			args: ['x2', 'x3', 'x4', 'x5']
		}
	};

	const _arm_stret = {
		'32': {
			receiver: 'r1',
			selector: 'r2',
			returns: 'r0',
			args: ['r3', 'r4', 'r5', 'r6']
		}
	};

	const _object_c_methods = {
		objc_msgSend: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSend_fpret: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSend_noarg: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSendSuper: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSendSuper2: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSend_stret: {
			'x86': _x86_stret,
			'ppc': {
				'32': _ppc_stret,
				'64': _ppc_stret
			},
			'arm': {
				'32': _arm_stret
			}
		},
		objc_msgSendSuper_stret: {
			'x86': _x86_stret,
			'ppc': {
				'32': _ppc_stret,
				'64': _ppc_stret
			},
			'arm': {
				'32': _arm_stret
			}
		},
		objc_msgSendSuper2_stret: {
			'x86': _x86_stret,
			'ppc': {
				'32': _ppc_stret,
				'64': _ppc_stret
			},
			'arm': {
				'32': _arm_stret
			}
		},
		/* fixup */
		objc_msgSend_fixup: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSend_fpret_fixup: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSendSuper2_fixup: {
			'x86': _x86,
			'ppc': {
				'32': _ppc,
				'64': _ppc
			},
			'arm': {
				'32': _arm,
				'64': _arm
			}
		},
		objc_msgSend_stret_fixup: {
			'x86': _x86_stret,
			'ppc': {
				'32': _ppc_stret,
				'64': _ppc_stret
			},
			'arm': {
				'32': _arm_stret
			}
		},
		objc_msgSendSuper2_stret_fixup: {
			'x86': _x86_stret,
			'ppc': {
				'32': _ppc_stret,
				'64': _ppc_stret
			},
			'arm': {
				'32': _arm_stret
			}
		}
	};

	return {
		arguments: function(callname) {
			callname = Extra.replace.call(callname);
			var arch = Global.evars.arch;
			var bits = Global.evars.archbits.toString();
			return _object_c_methods[callname][arch][bits].args.slice();
		},
		returns: function(callname) {
			callname = Extra.replace.call(callname);
			var arch = Global.evars.arch;
			var bits = Global.evars.archbits.toString();
			return _object_c_methods[callname][arch][bits].returns;
		},
		receiver: function(callname) {
			callname = Extra.replace.call(callname);
			var arch = Global.evars.arch;
			var bits = Global.evars.archbits.toString();
			return _object_c_methods[callname][arch][bits].receiver;
		},
		selector: function(callname) {
			callname = Extra.replace.call(callname);
			var arch = Global.evars.arch;
			var bits = Global.evars.archbits.toString();
			return _object_c_methods[callname][arch][bits].selector;
		},
		is: function(callname) {
			callname = Extra.replace.call(callname);
			return callname.startsWith('objc_');
		}
	};
})();