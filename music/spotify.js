const SpotifyWebApi = require("spotify-web-api-node");
const fetch = require("isomorphic-fetch");

class MySpotify {
    constructor() {
        this.token =
            "BQCZdJlI9ix8VciWR9mkLGEjxl3zc2D56QheV2RNnkYgAfGDhusM_7qoXjYMX-3RglmoS9rlud1fSXpyajs";

        this.api = new SpotifyWebApi({
            clientId: "4244bb258d444367a792863d4818aef9",
            clientSecret: "f4347c62ced64706a8e6c5dd1dc8d462",
            accessToken: this.token
        });
    }

    fetchSongDetails(title, artist) {
        const t = title;
        return this.api
            .searchTracks(`track:${title} artist:${artist}`, { limit: 1 })
            .then(res => {
                const data = res.body.tracks.items[0];

                if (!data) {
                    throw Error(`${t} not found`);
                    return;
                }

                const album = data.album.name;
                const artists = data.artists.reduce((a, c) => {
                    a.push(c.name);
                    return a;
                }, []);
                const disc_number = data.disc_number;
                const title = data.name;
                const track_number = data.track_number;
                const cover_art = data.album.images.find(i => i.height === 640)
                    .url;
                const year = data.album.release_date.split("-")[0];

                return {
                    title,
                    album,
                    artists,
                    cover_art,
                    year,
                    disc_number,
                    track_number
                };
            });
    }
}

module.exports = MySpotify;
