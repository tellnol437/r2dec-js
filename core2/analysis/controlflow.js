module.exports = (function() {
	var Expr = require('core2/analysis/ir/expressions');
	var Stmt = require('core2/analysis/ir/statements');

	function _find_next_block(address, blocks) {
		var addr;
		for (var i = 0; address && i < blocks.length; i++) {
			addr = blocks[i].address || blocks[i].addr;
			if (addr.eq(address)) {
				return i;
			}
		}
		return -1;
	}

	return {
		run: function(func) {
			var used, block, else_cntr, position, jumpblock, failblock, ifblock, elseblock;
			//console.log(JSON.stringify(func));
			block = func.entry_block;
			used = [];
			while (block && used.indexOf(block) < 0 && block.jump) {
				used.push(block);
				position = _find_next_block(block.jump, func.basic_blocks);
				if (position < 0) {
					break;
				}
				block.next = position;
				jumpblock = func.basic_blocks[position];
				if (jumpblock.address.lt(block.address)) {
					/* looping */
				} else if (block.fail) {
					failblock = func.basic_blocks[_find_next_block(block.fail, func.basic_blocks)];
					if (failblock && failblock.jump && failblock.jump.eq(jumpblock.jump)) {
						ifblock = failblock;
						elseblock = jumpblock;
						used.push(ifblock);
						used.push(elseblock);
					} else {
						ifblock = jumpblock;
						used.push(ifblock);
					}
					/* if condition needs to be negated */
					block.pop_stmt();
					block.push_stmt(new Stmt.If(ifblock.address, "???", ifblock, elseblock ? elseblock : null));
					block = func.basic_blocks[_find_next_block(jumpblock.jump, func.basic_blocks)];
				} else {
					block = jumpblock;
				}
			}
			//throw new Error('not implemented yet');
		}
	};
})();