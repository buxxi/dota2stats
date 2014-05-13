define(["jquery", "datgui", "tablesorter"], function() {
	return function TeamStats(DataContainer) {
		var self = this;
		self.container = DataContainer;
		self.type = "win-ratio";
		self.result = "";
		self.minimumGames = 1;
		self.minimumPlayers = 1;
		self.maximumPlayers = 5;
		self.exclusive = true;

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'type', self.container.teamTypeKeys()).onFinishChange(self.draw);
			gui.add(self, 'result', self.container.winLossKeys()).onFinishChange(self.draw);
			gui.add(self, 'minimumGames', 1, 100).step(1).onFinishChange(self.draw);
			gui.add(self, 'minimumPlayers', 1, 5).step(1).onFinishChange(self.draw);
			gui.add(self, 'maximumPlayers', 1, 5).step(1).onFinishChange(self.draw);
			gui.add(self, 'exclusive').onFinishChange(self.draw);
			for (var i in self.container.players) {
				var f = gui.addFolder(self.container.players[i].name);
				f.add(self.container.players[i],'show').onFinishChange(self.draw);
				f.addColor(self.container.players[i],'color').onChange(self.draw);
			}
			return gui;
		};

		this.draw = function() {	
			$("#table").show();
			self.render(self.getFilteredData());
		}

		this.getFilteredData = function() {
			var matches = {};

			var type = self.container.types[self.type];
			self.container.filteredData(true, "all", self.result, 
				function(user, match) {	
					var value = type.calc(match);
			
					if (!matches[match.matchid]) {
						matches[match.matchid] = { value : value, users : [user.id] };
					} else {
						matches[match.matchid].users.push(user.id);
						if (self.type != "win-ratio" && self.type != "radiant-ratio" && self.type != "duration") {
							matches[match.matchid].value += value;
						}
					}			
				}, 
				function (user) {}
			);

			var grouping = {};

			var addMatch = function(users, value) {
				var playerCount = users.length;
				if (playerCount < self.minimumPlayers || playerCount > self.maximumPlayers) {
					return;
				}

				if (!grouping[users]) {
					grouping[users] = [];
				}
				grouping[users.join(",")].push(value);
			};

			var combinations = function(users) {
				var result = [];
				var f = function(prefix, users) {
					for (var i = 0; i < users.length; i++) {
						var tmp = [];
						for (var j in prefix) {
							tmp.push(prefix[j]);
						}
						tmp.push(users[i]);
						result.push(tmp);
						f(tmp, users.slice(i + 1));
					}
				};
				f([], users);
				return result;
			};


			for (var j in matches) {
				if (self.exclusive) {
					addMatch(matches[j].users, matches[j].value);
				} else {
					var result = combinations(matches[j].users);
					for (var k in result) {
						addMatch(result[k], matches[j].value);
					}
				}
			}
			
			var result = [];
			var avg = 0;

			for (var j in grouping) {
				if (grouping[j].length >= self.minimumGames) {
					var sum = self.container.types[self.type].sum(grouping[j]);
					avg += sum;
					result.push({users : j.split(","), value : sum, count : grouping[j].length});
				} 
			}

			avg = avg / result.length;

			for (var j in result) {
				var r = result[j];
				r.weighted = (r.count / (r.count + self.minimumGames)) * r.value + (self.minimumGames / (r.count + self.minimumGames)) * avg;
			}

			result.sort(function(a, b) {
				return b.weighted - a.weighted;
			});	

			return result;
		}

		this.render = function(data) {
			self.data = data;
			var pos = 1;
			$("#table thead tr").remove();
			$("#table tbody tr").remove();
			$("#table table thead").append("<tr><th>#</th><th>Player #1</th><th>Player #2</th><th>Player #3</th><th>Player #4</th><th>Player #5</th><th>Games</th><th>" + self.type + "</th></tr>");
			for (var i in data) {
				var team = data[i];
				$("#table table tbody").append("<tr>" +
					"<td>" + pos++ + "</td>" +  
					playerTD(team.users[0]) + 
					playerTD(team.users[1]) +
					playerTD(team.users[2]) +
					playerTD(team.users[3]) +
					playerTD(team.users[4]) +
					"<td>" + team.count + "</td>" +
					"<td title='weighted: " + team.weighted + "'>" + self.container.types[self.type].format(team.value) + "</td>" +
					"</tr>");
			}
			$("#table table").tablesorter();
		};

		function playerTD(userid) {
			if (!userid) {
				return "<td></td>";
			}
			return "<td style='background-color :" + self.container.players[userid].color +"'>" + self.container.players[userid].name + "</td>";
		}
	};
});
