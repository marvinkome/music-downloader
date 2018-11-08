const getGenre = require("./music/musixmatch");
const Myspotify = require("./music/spotify");
const get_songs = require("./get-songs");
const writeData = require("./metadata");

const spotify = new Myspotify();
const songs = get_songs();

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
        console.log({ e: e.message });
    }
}

async function mapSong(song) {
    // get song detail from api
    try {
        const res = await getSongData(song.title, song.artist);
        // update the meta tags
        await writeData(song.path, res);
    } catch (e) {
        return;
    }
}

function work() {
    return new Promise((res, rej) => {
        songs.forEach((song, index) => {
            try {
                mapSong(song);
            } catch (e) {
                rej(e);
            }

            if (index === array.length - 1) {
                res(undefined);
            }
        });
    });
}

work()
    .then(() => console.log("done"))
    .catch(e => console.log("Error", e.message));
