const axios = require("axios");
const querystring = require("querystring");

const clientID = process.env.SPOTIFY_ID;
const clientSecret = process.env.SPOTIFY_SECRET;

class Spotify {
    constructor(clientID, clientSecret) {
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.token = null;
        this.axios = axios.create({
            baseURL: "https://api.spotify.com/v1/"
        });

        return (async () => {
            await this.authorize();
            return this;
        })();
    }

    async authorize() {
        const authKey = Buffer.from(
            `${this.clientID}:${this.clientSecret}`
        ).toString("base64");

        try {
            const axiosData = await axios.post(
                "https://accounts.spotify.com/api/token/",
                querystring.stringify({
                    grant_type: "client_credentials"
                }),
                {
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${authKey}`
                    }
                }
            );

            // set token
            const { access_token } = axiosData.data;
            this.axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${access_token}`;
            this.token = access_token;
        } catch (e) {
            console.error("Error during authorization:", e.message);
            console.error({
                clientID: this.clientID,
                clientSecret: this.clientSecret,
                authKey
            });
        }
    }

    async searchTrack(title, artist) {
        try {
            const { data } = await this.axios.get("/search", {
                params: {
                    q: `track:${title} artist:${artist}`,
                    type: "track"
                }
            });

            return this.__formatSongData(data);
        } catch (e) {
            console.error("Error searching for song:", e.message);
            console.error(e.config);
        }
    }

    __formatSongData(response) {
        const item = response.tracks.items[0];

        const data = {
            album: item.album.name,
            artist: item.artists
                .reduce((a, c) => {
                    a.push(c.name);
                    return a;
                }, [])
                .join(", "),
            disc_number: item.disc_number,
            title: item.name,
            track_number: item.track_number,
            cover_art: item.album.images.find(i => i.height === 640).url,
            year: item.album.release_date.split("-")[0]
        };

        return data;
    }
}

async function init() {
    const spotify = await new Spotify(clientID, clientSecret);
    const resp = await spotify.searchTrack("White onions", "foals");
    console.log(resp);
}

init();
