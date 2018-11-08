const getGenre = require("./music/musixmatch");
const Myspotify = require("./music/spotify");
const { Downloader, setUpDriver } = require("./crawler");
const songs = require("./song_list");
const writeData = require("./metadata");

const spotify = new Myspotify();

async function getSongData(title, artist) {
    console.log("fetching songs from apis", title, artist);

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

async function main(res, rej) {
    // setup download instance
    const driver = await setUpDriver();
    const downloadIns = new Downloader(driver);
    await downloadIns.init();

    // map through all song
    songs.forEach(async (song, index) => {
        // 2: download song and return file path
        const filePath = await downloadIns
            .downloadSong(song.title, song.artist)
            .catch(e => rej(`Downloader (${e})`));

        if (!filePath) return;

        // 3: get the file metadata from api
        const res = await getSongData(song.title, song.artist).catch(e =>
            rej(`Metadata (${e})`)
        );

        // 4: write metadata
        await writeData(song.path, res).catch(e => rej(`Write data (${e})`));

        if (index === songs.length - 1) res(undefined);
    });
}

function work() {
    return new Promise(main);
}

work()
    .then(() => console.log("done"))
    .catch(e => console.log("Error", e.message));
