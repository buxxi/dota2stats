define(["jquery", "datgui", "tablesorter"], function() {
	return function TeamStats(DataContainer) {
		var self = this;
		self.container = DataContainer;
		self.type = "win-ratio";
		self.minimumGames = 1;
		self.minimumPlayers = 1;
		self.maximumPlayers = 5;

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'type', self.container.nonUniqueTypeKeys()).onFinishChange(self.draw);
			gui.add(self, 'minimumGames', 1, 100).step(1).onFinishChange(self.draw);
			gui.add(self, 'minimumPlayers', 1, 5).step(1).onFinishChange(self.draw);
			gui.add(self, 'maximumPlayers', 1, 5).step(1).onFinishChange(self.draw);
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
		}

		this.getFilteredData = function() {
			var matches = [];

			for (var i in self.container.unfilteredData) {
				var user = self.container.unfilteredData[i];
				if (!self.container.players[user.id].show) {
					continue;
				}

				for (var j in user.matches) {
					var match = user.matches[j];

					if (!matches[match.matchid]) {
						matches[match.matchid] = { value : self.container.types[self.type].calc(match), users : [user.id] };
					} else {
						matches[match.matchid].users.push(user.id);
					}
				}
			}

			var grouping = {};
			for (var j in matches) {
				var playerCount = matches[j].users.length;
				if (playerCount < self.minimumPlayers || playerCount > self.maximumPlayers) {
					continue;
				}
				if (!grouping[matches[j].users]) {
					grouping[matches[j].users] = [];
				}
				grouping[matches[j].users.join(",")].push(matches[j].value);
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
			$("#table thead tr").remove();
			$("#table tbody tr").remove();
			$("#table table thead").append("<tr><th>Player #1</th><th>Player #2</th><th>Player #3</th><th>Player #4</th><th>Player #5</th><th>Games</th><th>Won</th></tr>");
			for (var i in data) {
				var team = data[i];
				$("#table table tbody").append("<tr>" + 
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
