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
    return {
        OVERFLOW: {
            cmp: 'OF',
            signed: true
        },
        NE: {
            cmp: 'NE',
            signed: false
        },
        EQ: {
            cmp: 'EQ',
            signed: false
        },
        LT_S: {
            cmp: 'LT',
            signed: true
        },
        LE_S: {
            cmp: 'LE',
            signed: true
        },
        GT_S: {
            cmp: 'GT',
            signed: true
        },
        GE_S: {
            cmp: 'GE',
            signed: true
        },
        LT_U: {
            cmp: 'LT',
            signed: false
        },
        LE_U: {
            cmp: 'LE',
            signed: false
        },
        GT_U: {
            cmp: 'GT',
            signed: false
        },
        GE_U: {
            cmp: 'GE',
            signed: false
        },
    };
})();