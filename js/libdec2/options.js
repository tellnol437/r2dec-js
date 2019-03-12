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
	const r2 = require('libdec2/r2');

	function Options() {
		this.debug = r2.bool('e r2dec.debug');
		this.help = false;
		this.issue = false;
		this.theme = r2.string('e r2dec.theme');
		this.view = {
			assembly: r2.bool('e r2dec.view.assembly'),
			casts: r2.bool('e r2dec.view.casts'),
		};
		this.output = {
			comment: false,
			project: false,
			colors: r2.bool('e scr.html'),
			html: r2.number('e scr.color', 0) > 0,
		};
		this.analysis = {};
		this.language = "C";
		/* extra infos */
		this.file = r2.string('i~^file[1:0]');
		this.offset = r2.string('s');
		/* arguments accepted by r2dec */
		this.sanitize = new r2.sanitize();
		this.args = {
			"--help": {
				description: "this help message",
				set: function(self) {
					self.usage();
					self.help = true;
				}
			},
			"--debug": {
				description: "do not catch exceptions; useful for r2dec development.",
				set: function(self) {
					self.debug = true;
				}
			},
			"--issue": {
				description: "generates the json used for the test suite",
				set: function(self) {
					self.issue = true;
				}
			},
			"--assembly": {
				description: "shows the original assembly code side to side with the decompiled code",
				set: function(self) {
					self.view.assembly = true;
				}
			},
			"--casts": {
				description: "shows all casts in the decompiled code",
				set: function(self) {
					self.view.casts = true;
				}
			},
			"--as-comment": {
				description: "the decompiled code is returned to r2 as comment (via CCu)",
				set: function(self) {
					self.output.comment = true;
				}
			},
			"--as-project": {
				description: "the decompiled code is returned as an r2 command (CCu base64:<b64>)",
				set: function(self) {
					self.output.project = true;
				}
			},
			"--colors": {
				description: "enables syntax colors",
				set: function(self) {
					self.output.colors = true;
				}
			},
			"--html": {
				description: "outputs html data instead of text",
				set: function(self) {
					self.output.html = true;
				}
			},
			"--lang-c": {
				description: "set the output language as C",
				set: function(self) {
					self.language = "C";
				}
			},
		};
		this.parse = function(argv) {
			for (var i = 0; i < argv.length; i++) {
				if (!this.args[argv[i]]) {
					console.log("Unknown option '" + argv[i] + "'.");
					this.usage();
					return false;
				}
				this.args[argv[i]].set(this);
			}
			return !this.help;
		};

		this.dump = function() {
			console.log("[Options");
			console.log('    debug:          ' + this.debug);
			console.log('    help:           ' + this.help);
			console.log('    issue:          ' + this.issue);
			console.log('    theme:          ' + this.theme);
			console.log('    view.assembly:  ' + this.view.assembly);
			console.log('    view.casts:     ' + this.view.casts);
			console.log('    output.comment: ' + this.output.comment);
			console.log('    output.project: ' + this.output.project);
			console.log('    output.colors:  ' + this.output.colors);
			console.log('    output.html:    ' + this.output.html);
			//console.log('    analysis:       ' + this.analysis);
			console.log('    language:       ' + this.language);
			console.log('    file:           ' + this.file);
			console.log('    offset:         ' + this.offset);
			console.log("]");
		};

		this.usage = function() {
			var key, psize = 4;
			console.log("r2dec [options]");
			for (key in this.args) {
				psize = Math.max(psize, key.length);
			}
			var padding = " ".repeat(psize);
			for (key in this.args) {
				var cmd = key + padding.substr(key.length, padding.length);
				console.log("       " + cmd + " | " + this.args[key].description);
			}
		};

		this.exception = function(exception) {
			this.sanitize.set(false);
			if (this.debug) {
				console.log('Exception:', exception.stack);
				this.dump();
			} else {
				console.log(
					'\n\nr2dec has crashed (info: ' + this.file + ' @ ' + this.offset + ').\n' +
					'Please report the bug at https://github.com/wargio/r2dec-js/issues\n' +
					'Use the command \'pddi\' or the option \'--issue\' to generate \n' +
					'the needed data for the issue.'
				);
			}
		};
	}
	return new Options();
})();