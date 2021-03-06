dota2stats
==========
A statistics page in javascript, python and mysql for tracking progress of a few number of players in dota2.

#### installation
1. Deploy the files to a new folder in the document root of your apache
2. Add dotaconfig.py to your python path
3. Create the database described below
4. Add users to the users-table manually
5. Run ```python py/data.py --update-heroes heroes.json img/heroes``` from the newly deployed folder to update heroes and download hero portraits
6. Run (or add to cron for daily updates) ```python py/data.py --load-matches``` every time you want to fetch newly played matches for the players (use absolute paths)

#### sql tables
```sql
CREATE TABLE `matches` ( 
  `matchid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `heroid` int(11) NOT NULL,
  `datetime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `duration` int(11) NOT NULL,
  `kills` int(11) NOT NULL,
  `deaths` int(11) NOT NULL,
  `assists` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `gold` int(11) NOT NULL,
  `lasthits` int(11) NOT NULL,
  `denies` int(11) NOT NULL,
  `xp_min` int(11) NOT NULL,
  `gold_min` int(11) NOT NULL,
  `won` enum('true','false') NOT NULL,
  `radiant` enum('true','false') NOT NULL,
  `total_kills` int(11) NOT NULL,
  `total_deaths` int(11) NOT NULL,
  `captain` enum('true','false') DEFAULT NULL,
  `max_level` int(11) DEFAULT NULL,
  `hero_damage` int(11) DEFAULT NULL,
  `tower_damage` int(11) DEFAULT NULL,
  `game_mode` int(11) DEFAULT NULL,
  PRIMARY KEY (`matchid`,`userid`) 
) ENGINE=InnoDB DEFAULT CHARSET=latin1

CREATE TABLE `users` ( 
  `userid` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `active` enum('true','false') DEFAULT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`userid`) 
) ENGINE=InnoDB DEFAULT CHARSET=latin1

CREATE TABLE `heroes` ( 
  `heroid` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `carry` enum('true','false') DEFAULT 'false',
  `disabler` enum('true','false') DEFAULT 'false',
  `durable` enum('true','false') DEFAULT 'false',
  `escape` enum('true','false') DEFAULT 'false',
  `initiator` enum('true','false') DEFAULT 'false',
  `jungler` enum('true','false') DEFAULT 'false',
  `lanesupport` enum('true','false') DEFAULT 'false',
  `nuker` enum('true','false') DEFAULT 'false',
  `pusher` enum('true','false') DEFAULT 'false',
  `support` enum('true','false') DEFAULT 'false',
  `melee` enum('true','false') DEFAULT 'false',
  `ranged` enum('true','false') DEFAULT 'false',
  PRIMARY KEY (`heroid`) 
) ENGINE=InnoDB DEFAULT CHARSET=latin1
```


#### javascript dependencies
* jquery
* flot
* flot-selection
* require.js
* jquery-tablesorter
* dat-gui
* chroma
* chroma-palette

#### python dependencies
* pymysql

