define("records", ["jquery", "datgui"], function() {
	return function Records(DataContainer) {
		var self = this;
		self.container = DataContainer;
		self.role = "all";

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'role', self.container.roleKeys()).onFinishChange(self.draw);

			for (var i in self.container.players) {
				var f = gui.addFolder(self.container.players[i].name);
				f.add(self.container.players[i],'show').onFinishChange(self.draw);
				f.addColor(self.container.players[i],'color').onChange(self.draw);
				f.open();
			}
			return gui;
		};

		this.draw = function() {
			$("#table").show();
			self.render(self.getFilteredData());
		};

		this.getFilteredData = function() {
			var result = [];

			for (var i in self.container.unfilteredData) {
				var user = self.container.unfilteredData[i];
				if (!self.container.players[user.id].show) {
					continue;
				}

				var records = {};
				for (var j in user.matches) {
					var match = user.matches[j];
					
					if (!self.container.roles[self.role](match)) {
						continue;
					}
	
					for (var k in self.container.types) {
						var type = self.container.types[k];
						var value = type.sum([type.calc(match)]);
						if (!(k in records) || value > records[k].value) {
							records[k] = { value: value, matchid: match.matchid };
						}
					}
				}
				result.push({ userid: user.id, data: records });				
			}


			return result;
		};


		this.render = function(data) {
			self.data = data;
			$("#table thead tr").remove();
			$("#table tbody tr").remove();
			$("#table table thead").append("<tr><th></th></tr>");
			for (var j in data) {
				$("#table table thead tr").append("<th>" + self.container.players[data[j].userid].name + "</th>");
			}			
			
			for (var j in self.container.types) {
				$("#table table tbody").append("<tr><th>" + j + "</th>");

				for (var i in data) {
					var value = self.container.types[j].format(data[i].data[j].value);
					var showColor = isMax(data, data[i].data[j].value, j);
					var func = showColor ? playerTD : normalTD;
					$("#table table tbody tr:last").append(func(data[i].userid, data[i].data[j].matchid, value));
				}
			}
		};

		function isMax(data, value, type) {
			for (var i in data) {
				if (data[i].data[type].value > value) {
					return false;
				}
			}
			return true;
		}

		function normalTD(userid, matchid, value) {
			if (!userid) {
				return "<td></td>";
			}
			return "<td><a href='http://dotabuff.com/matches/" + matchid + "'>" + value + "</a></td>";
		}

		function playerTD(userid, matchid, value) {
			if (!userid) {
				return "<td></td>";
			}
			return "<td style='background-color :" + self.container.players[userid].color +"'><a href='http://dotabuff.com/matches/" + matchid + "'>" + value + "</a></td>";
		}
	};
});

