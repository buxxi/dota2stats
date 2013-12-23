define(["jquery"], function() {
	return function Tooltip(DataContainer) {
		var self = this;
		self.container = DataContainer;

		self.show = function(position, content, header, matchid) {
			var left = "auto";
			var right = "auto";
			var top = "auto";
			var bottom = "auto";

			if ($("#tooltip").width() + position.pageX > $(window).width()) {
				right = $(window).width() - position.pageX - 5;
			} else {
				left = position.pageX + 5;	
			}
			if ($("#tooltip").height() + position.pageY > $(window).height()) {
				bottom = $(window).height() - position.pageY - 5;
			} else {
				top = position.pageY + 5;	
			}				
			
			$("#tooltip h2").text(header);
			$("#tooltip p").html(content);
			if (matchid) {
				$("#tooltip a, #tooltip-users").show();
				$("#tooltip a").attr("href", "http://dotabuff.com/matches/" + matchid);
				var users = $("#tooltip-users tr").empty();
				for (var i in self.container.unfilteredData) {
					var user = self.container.unfilteredData[i];
					for (var j in user.matches) {
						if (user.matches[j].matchid == matchid) {
							users.append($(playerTD(user.id)));	
						}
					}
				}
			} else {
				$("#tooltip a, #tooltip-users").hide();
			}

			$("#tooltip").css({ left: left, right : right, top: top, bottom: bottom}).fadeIn(200);
		}

		function playerTD(userid) {
			if (!userid) {
				return "<td></td>";
			}
			return "<td style='background-color :" + self.container.players[userid].color +"'>" + self.container.players[userid].name + "</td>";
		}

		self.isShowing = function() {
			return $("#tooltip").is(":visible");
		}

		self.hide = function() {
			$("#tooltip").fadeOut(200);
		}
	};
});
