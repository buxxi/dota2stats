define(["tooltip", "jquery", "datgui", "flot", "flotgantt"], function(Tooltip) {
	return function Streaks(DataContainer) {
		var self = this;
		self.container = DataContainer;
		self.type = "win-ratio";
		self.min = 1;
		self.max = 100;
		self.minStreak = 3;
		self.tooltip = new Tooltip(DataContainer);

		this.gui = function() {
			var gui = new dat.GUI({ autoPlace: false });
			gui.add(self, 'type', self.container.typeKeys()).onFinishChange(self.draw);
			gui.add(self, 'min', 0, 1000).step(1).onFinishChange(self.draw);
			gui.add(self, 'max', 0, 1000).step(1).onFinishChange(self.draw);
			gui.add(self, 'minStreak', 1, 100).step(1).onFinishChange(self.draw);
			var players = self.container.players;
			for (var i in players) {
				var f = gui.addFolder(self.container.players[i].name);
				f.add(players[i],'show').onFinishChange(self.draw);
				f.addColor(players[i],'color').onChange(self.draw);
				f.open();
			}
			return gui;
		};

		this.draw = function() {
			var options = {
				legend: {
					show: false
				},
				series: {
					gantt: {
						active: true,
						show:true,
						barHeight: 0.2
					}
				},
				grid: { 
					hoverable: true,
					clickable: true
				},
				yaxis: {
					show : false,
					min : 0,
					max : self.container.unfilteredData.length + 1
				},
				xaxis: {
					tickDecimals : 0
				}	
			};
			var chart = $("#chart");
			chart.unbind().show();
			var plot = $.plot(chart, self.getFilteredData(), options);
			chart.bind("plotclick", function(event, pos, item) {
				if (item == null) {
					self.tooltip.hide();
					return;
				} else {
					var itemdata = item.series.data[item.dataIndex];
					var content = "<b>" + itemdata[3] + "</b> games in a row, ended on " + $.plot.formatDate(new Date(itemdata[4]), "%Y-%m-%d");
					self.tooltip.show(pos, content, "");
				}				
			});
			
		}

		this.getFilteredData = function() {
			var data = [];

			var type = self.container.types[self.type];
			var result = [];


			var from;
			var count = 0;
			var i = 0;
			var j = 0;
			var matchdate;	

			self.container.filteredData(true, "all", "all", 
				function(user, match) {				
					matchdate = match.datetime;
					var value = type.sum([type.calc(match)]);
					if (value < self.min || value > self.max) {
						if (count >= self.minStreak) {
							result.push([from, self.container.unfilteredData.length -i, j, count, matchdate]);
						}
						count = 0;					
					} else if (count == 0) {
						from = j;
						count = 1;
					} else {
						count++;
					}
					j++;			
				}, 
				function (user) {
					if (count > self.minStreak) {
						result.push([from, self.container.unfilteredData.length - i, j, count]);
					}

					var color = self.container.players[user.id].color;
					data.push({data: result, label: user.name, color: color});
					i++;
					j = 0;
				}
			);

			return data;
		}
	};
});
