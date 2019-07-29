const getGenre = require("./music/musixmatch");
const Myspotify = require("./music/spotify");
const { downloadSong, setUpDriver } = require("./crawler");
const songs = require("./song_list");
const writeData = require("./metadata");

const spotify = new Myspotify();
const failedDownloads = [];
const failedGetMeta = [];
const failedWriteMeta = [];

async function getSongData(title, artist) {
    console.log("fetching meta from apis", title, artist);

    try {
        const res = await Promise.all([
            spotify.fetchSongDetails(title, artist),
            getGenre(title, artist)
        ]);
        const data = res[0];
        const genre = res[1];

        return Object.assign(data, genre);
    } catch (e) {
        throw Error(e.message);
    }
}

async function main() {
    // setup download instance
    const driver = await setUpDriver();

    try {
        await driver.get("https://www.mp3juices.cc/");
        console.log("*" * 5, "starting.....");

        // map through all song
        for (let song of songs) {
            let filePath;
            let res;

            // 2: download song and return file path
            console.log("*" * 5, "download song and return file path");
            try {
                filePath = await downloadSong(song.title, song.artist, driver);
            } catch (e) {
                console.log(e);
                failedDownloads.push(song);
                continue;
            }

            // 3: get the file metadata from api
            console.log("*" * 5, "get the file metadata from api");
            try {
                res = await getSongData(song.title, song.artist);
            } catch (e) {
                console.log(e);
                failedGetMeta.push(song);
                continue;
            }

            // 4: write metadata
            console.log("*" * 5, "write metadata");
            try {
                await writeData(filePath, res);
            } catch (e) {
                console.log(e);
                failedWriteMeta.push(song);
                continue;
            }

            await driver.navigate().refresh();
        }
    } finally {
        driver.quit();
    }
}

main()
    .then(() => console.log("done"))
    .catch(e => console.log("Error", e))
    .then(() => {
        console.log(
            "failed downloads",
            failedDownloads.length,
            failedDownloads
        );
        console.log("failed meta fetch", failedGetMeta.length, failedGetMeta);
        console.log(
            "failed write meta",
            failedWriteMeta.length,
            failedWriteMeta
        );
    });
