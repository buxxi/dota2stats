import dotaconfig
import json
import MySQLdb
from contextlib import closing

class TeamStats:
	def __init__(self, users, matches, won):
		self.users = users
		self.matches = matches
		self.won = won

	def output(self):
		return {
			'users' : [int(user) for user in self.users],
			'matches' : self.matches,
			'won'	: self.won
		}

def application(environ, start_response):
	with closing(conn_db()) as conn:
		with closing(conn.cursor()) as cursor:	
			teams = load_teams(cursor)
			content = json.dumps([team.output() for team in teams], indent=4)			

			status = '200 OK'
			response_headers = [('Content-type', 'text/plain'),('Content-Length', str(len(content)))]
			start_response(status, response_headers)
			return [content]

def conn_db():
	conn = MySQLdb.connect (host = dotaconfig.SQL_HOST, user = dotaconfig.SQL_USER, passwd = dotaconfig.SQL_PASSWORD, db = dotaconfig.SQL_DB, charset='utf8', use_unicode = True)
	conn.autocommit(True)	
	return conn

def load_teams(cursor):
	teams = []
	cursor.execute("SELECT a.users,COUNT(*) AS matches,AVG(IF(a.won = 'True', 100, 0)) AS won FROM (SELECT GROUP_CONCAT(u.userid order by u.name asc) AS users,m.won FROM users u, matches m where u.userid = m.userid GROUP BY matchid) AS a GROUP BY users ORDER BY won desc")
	for row in cursor.fetchall():
		teams.append(TeamStats(row[0].split(","),row[1], float(row[2])))
	return teams
