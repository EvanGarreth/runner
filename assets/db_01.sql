PRAGMA journal_mode = 'wal';

CREATE TABLE runs (
  id INTEGER PRIMARY KEY NOT NULL,
  type CHAR(1) CHECK( type in ( "T", "D", "F")),
  start DATETIME NOT NULL,
  end DATETIME NOT NULL,
  duration DATETIME AS (timediff(start, end)) STORED,

  locationDataId INTEGER,
  -- calculated from the data at the end of the run
  miles PRECISION NOT NULL,
  steps INTEGER NOT NULL,

  weatherId INTEGER,

  rating INTEGER NOT NULL,
  note TEXT,

  FOREIGN KEY(weatherId) REFERENCES weather(id),
  FOREIGN KEY(locationDataId) REFERENCES locationData(id)
);

-- not sure how many of these columns I'll actually care about, but more data doesn't hurt
CREATE TABLE weather (
  id INTEGER PRIMARY KEY NOT NULL,
  date DATETIME NOT NULL,
  temperature DOUBLE NOT NULL,
  precipitation CHAR(2) CHECK( precipitation in ( "M", "L", "H", "ST", "SN" )),
  windSpeed DOUBLE,
  windDirection CHAR(2) CHECK( windDirection in ( "N", "NE", "E", "SE", "S", "SW", "W", "NW")),
  airQuality INTEGER,
  humidity DOUBLE,
  uvIndex INTEGER
);

-- just gonna dump the json here for now. Don't see a point in having a row per sampled location 
CREATE TABLE locationData (
  id INTEGER PRIMARY KEY NOT NULL,
  json TEXT NOT NULL
);
