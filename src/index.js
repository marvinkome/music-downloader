const songs = require("../songs.json");
const path = require("path");

const { Downloader } = require("./lib/downloader");
const { Spotify } = require("./lib/spotify");
const { writeTag } = require("./lib/metadata");

const downloadPath = path.resolve(process.cwd(), "downloads");

const clientID = process.env.SPOTIFY_ID;
const clientSecret = process.env.SPOTIFY_SECRET;

async function init() {
  const downloader = await new Downloader(downloadPath);
  const spotify = await new Spotify(clientID, clientSecret);

  for (const song of songs) {
    try {
      // download song
      console.log("INFO:: Starting downloader");
      const filepath = await downloader.downloadSong(song.title, song.artist);

      // get info from spotify
      console.log("INFO:: Starting spotify");
      const spotifyData = await spotify.searchTrack(song.title, song.artist);

      // write data to file
      await writeTag(filepath, spotifyData, { downloadPath });
    } catch (e) {
      console.error("GEN ERR:: ", e);
    } finally {
      await downloader.driver.navigate().refresh();
    }
  }

  await downloader.driver.quit();
}

init();
