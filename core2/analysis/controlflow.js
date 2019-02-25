module.exports = (function() {
	var Expr = require('core2/analysis/ir/expressions');
	var Stmt = require('core2/analysis/ir/statements');

	return {
		run: function(func) {
			console.log(JSON.stringify(func, "parent"))
			throw new Error('not implemented yet');
		}
	};
})();