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
    //const Throw = require('libdec2/throw');
    //const Utils = require('libdec2/analysis/utils');
    //const Block = require('libdec2/analysis/block');

    function If(condition, body) {
        this.condition = condition;
        this.body = body;
        this.toString = function() {
            return "If(...){...}";
        };
    }

    function ElseIf(condition, body) {
        this.condition = condition;
        this.body = body;
        this.toString = function() {
            return "ElseIf(...){...}";
        };
    }

    function Else(body) {
        this.body = body;
        this.toString = function() {
            return "Else{...}";
        };
    }

    function DoWhile(condition, body) {
        this.condition = condition;
        this.body = body;
        this.toString = function() {
            return "Do{...}While(...);";
        };
    }

    function While(condition, body) {
        this.condition = condition;
        this.body = body;
        this.toString = function() {
            return "While(...){...}";
        };
    }

    function For(preloop, condition, postloop, body) {
        this.preloop = preloop;
        this.condition = condition;
        this.postloop = postloop;
        this.body = body;
        this.toString = function() {
            return "For(.;.;.){...}";
        };
    }

    function Switch(toswitch, jumptbl) {
        this.toswitch = toswitch;
        this.jumptbl = jumptbl;
        this.toString = function() {
            return "Switch(...){...}";
        };
    }

    return {
        If: If,
        ElseIf: ElseIf,
        Else: Else,
        DoWhile: DoWhile,
        While: While,
        For: For,
        Switch: Switch,
    };
})();