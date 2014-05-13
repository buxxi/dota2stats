define("herostats", ["jquery", "datgui", "tablesorter"], function() {
	return function HeroStats(DataContainer) {
		var self = this;
		self.container = DataContainer;

		self.role = "all";
		self.result = "all";
		self.type = "win-ratio";
		self.minimum = 5;

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'role', self.container.roleKeys()).onFinishChange(self.draw);
			gui.add(self, 'result', self.container.winLossKeys()).onFinishChange(self.draw);
			gui.add(self, 'type', self.container.typeKeys()).onFinishChange(self.draw);
			gui.add(self, 'minimum', 1, 100).step(1).onFinishChange(self.draw);

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
		};

		this.getFilteredData = function() {
			var result = [];
			var avg = 0;		

			var heroes = {};
			var type = self.container.types[self.type];
			self.container.filteredData(true, self.role, self.result, 
				function(user, match) {
					if (!heroes[match.hero]) {
						heroes[match.hero] = [];
					}
					heroes[match.hero].push(type.calc(match));
				},
				function(user) {
					for (var j in heroes) {
						var hero = heroes[j];
						if (hero.length >= self.minimum) {
							var sum = type.sum(hero);
							avg += sum;
							result.push({user : user.id, hero : j, value : sum, count : hero.length}); 
						}
					};
					heroes = {};
				}
			);	

			avg = avg / result.length;

			result.forEach(function(row) {
				row.weighted = (row.count / (row.count + self.minimum)) * row.value + (self.minimum / (row.count + self.minimum)) * avg;
			});

			result.sort(function(a, b) {
				return b.weighted - a.weighted;
			});

			return result;
		};

		this.dotabuffLink = function(userid,hero) {
			return "http://dotabuff.com/players/" + userid + "/matches?hero=" + hero.toLowerCase().replace(" ","-");
		}

		this.render = function(data) {
			self.data = data;
			$("#table thead tr").remove();
			$("#table tbody tr").remove();
			$("#table table thead").append("<tr><th>#</th><th>Player</th><th>Hero</th><th>Played</th><th>" + self.type + "</th><th class='linkcol'></th></tr>");
			var pos = 1;
			for (var i in data) {
				var stat = data[i];
				$("#table table tbody").append("<tr>" + 
					"<td>" + pos++ + "</td>" + 
					playerTD(stat.user) +
					heroTD(stat.hero) + 
					"<td>" + stat.count + "</td>" +
					"<td title='weighted: " + stat.weighted + "'>" + self.container.types[self.type].format(stat.value) + "</td>" +
					"<td class='linkcol'><a href='" + self.dotabuffLink(stat.user, stat.hero) + "'><img src='img/dotabuff.ico'/></a></td>" +
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

		function heroTD(hero) {
			if (!hero) {
				return "<td></td>";
			}
			var url = hero.toLowerCase().replace(/[^A-Za-z]/g,"");
			return "<td class='hero' style='background-image : url(img/heroes/" + url + ".png)'>" + hero + "</td>";
		}
	};
});

