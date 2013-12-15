import dotaconfig
import json
import MySQLdb
import urllib2
import sys
from contextlib import closing
from datetime import datetime
from cgi import parse_qs, escape


MATCH_URL = 		'https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/V001/?match_id=%s&key=%s'
MATCHES_URL = 		'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=%s&account_id=%s'
MATCHES_NEXT_URL = 	'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=%s&account_id=%s&start_at_match_id=%s'
HEROES_URL = 		'https://api.steampowered.com/IEconDOTA2_570/GetHeroes/v0001/?key=%s&language=en_us'
NAME_URL = 		'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=%s&key=%s'

class HeroInfo:
	def __init__(self, cursor):
		self.cursor = cursor;
	 	self.loaded_data = False
		self.names = {}
		self.roles = {}
		self.all_roles = ["carry", "disabler", "durable", "escape", "initiator", "jungler", "lanesupport", "nuker", "pusher", "support", "melee", "ranged"]

	def get_roles(self, heroid):
		if not self.loaded_data:
			self.loaded_data = True
			self.load_heroes()
		if heroid in self.roles:
			return self.roles[heroid]
		return []
				
	def get_name(self, heroid):
		if not self.loaded_data:
			self.loaded_data = True
			self.load_heroes()
		if heroid in self.names:
			return self.names[heroid]
		return ""
	
	def load_heroes(self):
		self.cursor.execute("SELECT * FROM heroes")
		heroes = self.cursor.fetchall()
		for hero in heroes:
			self.names[hero[0]] = hero[1]
			self.roles[hero[0]] = []
			for i in range(len(self.all_roles)):
				if hero[i + 2] == 'true':
					self.roles[hero[0]] += [self.all_roles[i].title()]


	def update(self, jsonpath):
		heroes = {}
		data = json.loads(urllib2.urlopen(HEROES_URL % dotaconfig.API_KEY).read())
		for x in data["result"]["heroes"]:
			heroes[x["localized_name"]] = x["id"]

		with closing(open(jsonpath, 'r')) as f:
			hero_info = json.loads(f.read())
			for key in hero_info:
				name = hero_info[key]['name']
				roles = hero_info[key]['roles'] + [hero_info[key]['atk']]
				self.update_hero(heroes[name], name, [item.lower() for item in roles])
	def update_hero(self, id, name, roles):
		parameters = ["carry" in roles, "disabler" in roles, "durable" in roles, "escape" in roles, "initiator" in roles, "jungler" in roles, "lanesupport" in roles, "nuker" in roles, "pusher" in roles, "support" in roles, "melee" in roles, "ranged" in roles, id]
		parameters = [name] + [str(p).lower() for p in parameters]		

		affected_rows = self.cursor.execute("UPDATE heroes SET name = %s, carry = %s, disabler = %s, durable = %s, escape = %s, initiator = %s, jungler = %s, lanesupport = %s, nuker = %s, pusher = %s, support = %s, melee = %s, ranged = %s WHERE heroid = %s", parameters)
		if affected_rows == 0:
			self.cursor.execute("INSERT INTO heroes(name,carry,disabler,durable,escape,initiator,jungler,lanesupport,nuker,pusher,support,melee,ranged,heroid) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", parameters)	

class MatchFetcher:
	def __init__(self, cursor):
		self.cursor = cursor
	
	def load_new_matches(self, userid):
		matchids = self.load_new_matchids(userid)
		
		for matchid in matchids:
			try:
				self.load_match(userid, matchid)	
			except urllib2.HTTPError:
				print ("Error fetching match with id: %s" % (matchid))
			except Exception:
				print ("Error parsing match with id: %s" % (matchid))

	def load_new_matchids(self, userid):
		newmatches = []
		nexturl = MATCHES_URL % (dotaconfig.API_KEY, userid)
		print ("Fetching %s" % (nexturl))
		data = json.loads(urllib2.urlopen(nexturl).read())["result"]	
		while data["matches"]:
			for x in data["matches"]:
				if self.has_match(userid, x["match_id"]):
					return newmatches	
				else:
					newmatches.insert(0, x["match_id"])
			nexturl = MATCHES_NEXT_URL % (dotaconfig.API_KEY, userid, newmatches[0] - 1)
			print ("Fetching %s" % (nexturl))
			data = json.loads(urllib2.urlopen(nexturl).read())["result"]	
		return newmatches
	
	def load_match(self, userid, matchid):
		nexturl = MATCH_URL % (matchid, dotaconfig.API_KEY)
		print ("Fetching %s" % (nexturl))
		data = json.loads(urllib2.urlopen(nexturl).read())["result"]

		if data["lobby_type"] != 0:
			raise Exception("Game was not a public matchmaking game")

		pdata = {}
		for x in data["players"]:
			if x["account_id"] == userid:
				pdata = x

		timestamp = datetime.fromtimestamp(data["start_time"]).isoformat()
		radiant = pdata["player_slot"] <= 4
		won = radiant == data["radiant_win"]

		parameters = [matchid, userid, pdata["hero_id"], timestamp, data["duration"], pdata["kills"], pdata["deaths"], pdata["assists"], pdata["level"], pdata["gold"] + pdata["gold_spent"], pdata["last_hits"], pdata["denies"], pdata["xp_per_min"], pdata["gold_per_min"], str(won), str(radiant) ]
		self.cursor.execute("INSERT INTO matches(matchid,userid,heroid,datetime,duration,kills,deaths,assists,level,gold,lasthits,denies,xp_min,gold_min,won,radiant) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", parameters)	

	def has_match(self, userid, matchid):
		self.cursor.execute("SELECT COUNT(1) FROM matches WHERE userid = %s and matchid = %s", [userid, matchid])
		return self.cursor.fetchone()[0]	

class MatchOutputter:
	def __init__(self, cursor, hero_info):
		self.cursor = cursor
		self.hero_info = hero_info

	def output(self, userid):
		self.cursor.execute("SELECT * FROM matches WHERE userid = %s ORDER BY datetime desc", [userid])
		matches = self.cursor.fetchall()
		return [self.format_match(match) for match in make_dict_list(matches, self.cursor)]
	
	def format_match(self, row):
		return {
			'matchid': row["matchid"],
			'hero': self.hero_info.get_name(row["heroid"]),
			'roles': self.hero_info.get_roles(row["heroid"]),
			'radiant': row["radiant"] == "true",
			'won': row["won"] == "true",
			'level': row["level"],
			'kills': row ["kills"],
			'deaths': row["deaths"],
			'assists': row["assists"],
			'gold': row["gold"],
			'lasthits': row["lasthits"],
			'denies': row["denies"],
			'xp_min': row["xp_min"], 
			'gold_min': row["gold_min"],
			'datetime': row["datetime"].isoformat(),
			'duration': row["duration"]
		}

class DotaUser:
	def __init__(self, userid, cursor):
		self.userid = userid
		self.cursor = cursor
		self.fetcher = MatchFetcher(cursor)
		self.outputter = MatchOutputter(cursor, HeroInfo(cursor))

	def fetch(self):
		if self.should_update():
			self.load_name()
			self.fetcher.load_new_matches(self.userid)
		
	def output(self):
		return {
			'id': self.userid,
			'name': self.name(),
			'matches': self.outputter.output(self.userid)
		}		

	def name(self):
		self.cursor.execute("SELECT name FROM users WHERE userid = %s", [self.userid])
		return self.cursor.fetchone()[0]

	def should_update(self):
		self.cursor.execute("SELECT COUNT(1) FROM users WHERE userid = %s and updated < NOW() - INTERVAL 1 DAY", [self.userid])
		return self.cursor.fetchone()[0]

	def load_name(self):
		userid64 = 76561197960265728 + self.userid
		data = json.loads(urllib2.urlopen(NAME_URL % (userid64, dotaconfig.API_KEY)).read())["response"]
		name = data["players"][0]["personaname"]
		self.cursor.execute("UPDATE users SET updated = NOW(), name = %s WHERE userid = %s", [name, self.userid])


def application(environ, start_response):
	with closing(conn_db()) as conn:
		with closing(conn.cursor()) as cursor:	
			users = load_users(cursor)
			[user.fetch() for user in users]	

			content = json.dumps([user.output() for user in users], indent=4)

			status = '200 OK'
			response_headers = [('Content-type', 'text/plain'),('Content-Length', str(len(content)))]
			start_response(status, response_headers)
			return [content]
	
def conn_db():
	conn = MySQLdb.connect (host = dotaconfig.SQL_HOST, user = dotaconfig.SQL_USER, passwd = dotaconfig.SQL_PASSWORD, db = dotaconfig.SQL_DB, charset='utf8', use_unicode = True)
	conn.autocommit(True)	
	return conn

def load_users(cursor):
	users = []
	cursor.execute("SELECT userid FROM users WHERE active = 'true'")
	for row in cursor.fetchall():
		users.append(DotaUser(row[0], cursor))
	return users

def make_dict_list(result, cursor):
	out = []
	for x in result:
		out.append(make_dict(x, cursor))
	return out

def make_dict(row, cursor):
	d = {}
	for idx, col in enumerate(cursor.description):
		d[col[0]] = row[idx]
	return d

if  __name__ =='__main__':
	with closing(conn_db()) as conn:
		with closing(conn.cursor()) as cursor:
			if sys.argv[1] == "--update-heroes":
				HeroInfo(cursor).update(sys.argv[2])
			elif sys.argv[1] == "--load-matches":
				[user.fetch() for user in load_users(cursor)]
	
	
		

		
 





