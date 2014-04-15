define("data-container", ["jquery", "palette"], function() {
	return function DataContainer() {
		var self = this;
		self.unfilteredData = [];
		self.players = {};
		self.roles = {
			"all" : function(node) { return true; }
		}
		self.types = {
			"kills" : { 
				calc : function(node) { return node.kills; },
				format : normalFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"kills+assists" : {
				calc : function(node) { return node.kills + node.assists; },
				format : normalFormat,
				sum : normalSum,
				teamRelevant : false
			},
			"kills/death" : {
				calc : function(node) { return [node.kills, node.deaths] },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false				
			},
			"kills+assists/death" : {
				calc : function(node) { return [node.kills + node.assists, node.deaths]; },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"assists":  { 
				calc : function(node) { return node.assists; }, 
				format : normalFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"deaths":  { 
				calc : function(node) { return node.deaths; },
				format : normalFormat, 
				sum : normalSum,
				teamRelevant : true
			},
			"gold" :  { 
				calc : function(node) { return node.gold; },
				format : normalFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"lasthits":  { 
				calc : function(node) { return node.lasthits; },
				format : normalFormat, 
				sum : normalSum,
				teamRelevant : true
			},
			"denies":  { 
				calc : function(node) { return node.denies; }, 
				format : normalFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"level":  { 
				calc : function(node) { return node.level; }, 
				format : normalFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"radiant-ratio":  { 
				calc : function(node) { return node.radiant ? 100 : 0; }, 
				format : percentFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"win-ratio":  { 
				calc : function(node) { return node.won ? 100 : 0; },
				format : percentFormat,
				sum : normalSum,
				teamRelevant : true
			}, 
			"kill+assist-ratio": {
				calc : function(node) { return [100 * (node.kills + node.assists), node.total_kills]; },
				format : percentFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"death-ratio": {
				calc : function(node) { return [100 * node.deaths, node.total_deaths]; },
				format : percentFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"duration": {
				calc : function(node) { return node.duration; },
				format : timeFormat,
				sum : normalSum,
				teamRelevant : true
			},
			"kills/min": {
				calc  : function(node) { return [ node.kills, node.duration / 60 ]; },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"kills+assists/min" : {
				calc : function(node) { return [ node.kills + node.assists, node.duration / 60 ]; },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"assists/min" : {
				calc : function(node) { return [ node.assists, node.duration / 60 ]; },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"deaths/min" : {
				calc : function(node) { return [ node.deaths, node.duration / 60 ]; },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"lasthits/min" : {
				calc : function(node) { return [ node.lasthits, node.duration / 60 ]; },
				format : normalFormat,
				sum : averageSum,
				teamRelevant : false
			},
			"gold/min":  { 
				calc : function(node) { return node.gold_min; },
				format : normalFormat,
				sum : normalSum,
				teamRelevant : false
			},
			"xp/min":  { 
				calc : function(node) { return node.xp_min; }, 
				format : normalFormat,
				sum : normalSum,
				teamRelevant : false
			}
			
		};

		self.load = function(callback) {
			$.getJSON("py/data.py", function(data) {
				self.unfilteredData = data;	
				buildPlayers();
				buildRoles();
				callback();
			});
		}

		self.roleKeys = function() {
			var result = [];
			for (var i in self.roles) {
				result.push(i);	
			}
			return result;

		}

		self.teamTypeKeys = function() {
			var result = [];
			for (var i in self.types) {
				if (self.types[i].teamRelevant) {
					result.push(i);
				}
			}
			return result;
		}

		self.typeKeys = function() {
			var result = [];
			for (var i in self.types) {
				result.push(i);
			}
			return result;
		}

		self.winLossKeys = function() {
			return ["all", "wins only", "losses only"];
		}

		self.winLossFilter = function(value) {
			return function(match) {
				if (value == "wins only") {
					return match.won;
				} else if (value == "losses only") {
					return !match.won;
				}
				return true;
			};
		}

		self.maxCount = function() {
			var max = 0;
			for (var i in self.unfilteredData) {
				var len = self.unfilteredData[i].matches.length;
				if (len > max) {
					max = len;
				}
			}
			return max;
		}

		function averageSum(tmp) {
			var a = 0;
			var b = 0;
			for (var j = 0; j < tmp.length;j++) {
				a += tmp[j][0];
				b += tmp[j][1];
			}
			return a / Math.max(b,1); 
		}

		function normalSum(tmp) {
			var sum = 0;
			for (var j = 0; j < tmp.length;j++) {
				sum += tmp[j];
			}
			return sum / tmp.length;
		}

		function timeFormat(input) {
			input = input.toFixed(0);
			var days = Math.floor(input / 86400);
			var hours = Math.floor((input - (days * 86400)) / 3600);
			var minutes = Math.floor((input - (days * 86400) - (hours * 3600)) / 60);
			return (days > 0 ? days + "d" : "") + (hours > 0 ? hours + "h" : "") + minutes + "m";
		}

		function percentFormat(input) {
			return input.toFixed(0) + "%";
		}

		function normalFormat(input) {
			return input.toFixed(2); 
		}

		function addRole(role) {
			self.roles[role] = function(node) { 
				return node.roles.indexOf(role) != -1;
			};
		}

		function buildPlayers() {
			var filter = function(color) { 
				var hcl = color.hcl();
				return hcl[0]>=0 && hcl[0]<=360 && hcl[1]>=0.6 && hcl[1]<=3 && hcl[2]>=0.2 && hcl[2]<=1.1;
			};

			var colors = paletteGenerator.generate(self.unfilteredData.length, filter, false, 50);
	
			for (var i in self.unfilteredData) {
				var user = self.unfilteredData[i];

				self.players[user.id] = { 
					"name" : user.name,
					"color" : colors[i].hex(),
					"show" : true
				}
			}
		}

		function buildRoles() {
			for (var i in self.unfilteredData) {
				var user = self.unfilteredData[i];
				for (var j in user.matches) {
					var match = user.matches[j];
					for (var k in match.roles) {
						var role = match.roles[k];

						if (!self.roles[role]) {
							addRole(role);
						}
					}
				}
			}
		}
	};
});

