import { SQLiteDatabase } from 'expo-sqlite';
// import { fs } from 'react-native-fs';

export async function seedTestData(db: SQLiteDatabase) {
  // Check if test data already exists
  const existingData = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM locationData WHERE id = 1'
  );

  if (existingData && existingData.count > 0) {
    console.log('Test data already exists, skipping seed');
    return;
  }

  // Insert fake location data (loop path in Golden Gate Park area, SF)
  const locationData = [
    { latitude: 37.7694, longitude: -122.4862 },
    { latitude: 37.7696, longitude: -122.4865 },
    { latitude: 37.7699, longitude: -122.4868 },
    { latitude: 37.7702, longitude: -122.4871 },
    { latitude: 37.7705, longitude: -122.4873 },
    { latitude: 37.7709, longitude: -122.4875 },
    { latitude: 37.7713, longitude: -122.4876 },
    { latitude: 37.7717, longitude: -122.4876 },
    { latitude: 37.7721, longitude: -122.4875 },
    { latitude: 37.7724, longitude: -122.4873 },
    { latitude: 37.7727, longitude: -122.487 },
    { latitude: 37.7729, longitude: -122.4866 },
    { latitude: 37.773, longitude: -122.4862 },
    { latitude: 37.773, longitude: -122.4858 },
    { latitude: 37.7729, longitude: -122.4854 },
    { latitude: 37.7727, longitude: -122.485 },
    { latitude: 37.7724, longitude: -122.4847 },
    { latitude: 37.7721, longitude: -122.4845 },
    { latitude: 37.7717, longitude: -122.4844 },
    { latitude: 37.7713, longitude: -122.4844 },
    { latitude: 37.7709, longitude: -122.4845 },
    { latitude: 37.7705, longitude: -122.4847 },
    { latitude: 37.7702, longitude: -122.485 },
    { latitude: 37.7699, longitude: -122.4853 },
    { latitude: 37.7696, longitude: -122.4856 },
    { latitude: 37.7694, longitude: -122.4859 },
    { latitude: 37.7694, longitude: -122.4862 },
  ];

  await db.runAsync('INSERT INTO locationData (id, json) VALUES (?, ?)', [1, JSON.stringify(locationData)]);

  // Insert test run
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(8, 0, 0, 0);

  const endTime = new Date(yesterday);
  endTime.setMinutes(endTime.getMinutes() + 28);

  await db.runAsync(
    `INSERT INTO runs (type, start, end, miles, steps, rating, note, locationDataId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['F', yesterday.toISOString(), endTime.toISOString(), 2.8, 4200, 4, 'Beautiful morning run through the park! Weather was perfect.', 1]
  );

  console.log('Test data seeded successfully');
}

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version;

  if (currentDbVersion === undefined) {
    throw "couldn't get db version";
  }

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    // TODO: load from file

    await db.execAsync(`
PRAGMA journal_mode = 'wal';

CREATE TABLE runs (
  id INTEGER PRIMARY KEY NOT NULL,
  type CHAR(1) CHECK( type in ( "T", "D", "F")),
  start DATETIME NOT NULL,
  end DATETIME NOT NULL,
  duration DATETIME AS (timediff(unixepoch(start), unixepoch(end))) STORED,

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
`);
    currentDbVersion = 1;
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function initDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await seedTestData(db);
}
