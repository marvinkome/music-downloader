const { Crawler } = require("./lib/downloader");
const { Spotify } = require("spotify-node-sdk");
const { writeTag } = require("./lib/metadata");

/**
 * Downloads songs from mp3juices.cc and add metadata from spotify
 * @param {Array<{ title: string, artist: string}>} songs - lists for songs to download from
 * @param {{
 *  spotifyClientID: string,
 *  spotifyClientSecret: string,
 *  downloadPath: string
 * }} options - options to pass to modules
 */
async function musicDownloader(songs, { downloadPath, ...options }) {
    const downloader = await new Crawler(downloadPath);
    const spotify = await new Spotify(options.spotifyClientID, options.spotifyClientSecret);

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

exports.musicDownloader = musicDownloader;
