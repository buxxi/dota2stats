define(["jquery", "datgui", "tablesorter"], function() {
	return function TeamStats(DataContainer) {
		var self = this;
		self.container = DataContainer;

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			for (var i in self.container.players) {
				var f = gui.addFolder(self.container.players[i].name);
				f.addColor(self.container.players[i],'color').onChange(self.draw);
				f.open();
			}
			return gui;
		};

		this.draw = function() {	
			$("#table").show();
			if (!self.data) {
				self.data = [];
				$.getJSON("py/teamstats.py", self.render);
			} else {
				self.render(self.data);
			}
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
					"<td>" + team.matches + "</td><td>" + team.won + "%</td></tr>");
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
