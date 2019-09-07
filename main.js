const songs = require("./songs.json");
const { Crawler } = require("./lib/downloader");
const { Spotify } = require("./lib/spotify");
const { writeTag } = require("./lib/metadata");

async function init() {
    const downloader = await new Crawler();
    const spotify = await new Spotify();

    for (const song of songs) {
        try {
            // download song
            console.log("INFO:: Starting downloader");
            const filepath = await downloader.downloadSong(song.title, song.artist);

            // get info from spotify
            console.log("INFO:: Starting spotify");
            const spotifyData = await spotify.searchTrack(song.title, song.artist);

            // write data to file
            await writeTag(filepath, spotifyData);
        } catch (e) {
            console.error("GEN ERR:: ", e);
        } finally {
            await downloader.driver.navigate().refresh();
        }
    }

    await downloader.driver.quit();
}

init();