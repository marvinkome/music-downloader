const axios = require("axios");
const utils = require("../utils");

const clientID = process.env.SPOTIFY_ID;
const clientSecret = process.env.SPOTIFY_SECRET;

class Spotify {
  constructor() {
    this.clientID = process.env.SPOTIFY_ID;
    this.clientSecret = process.env.SPOTIFY_SECRET;
    this.token = null;

    this.axios = axios.create({
      baseURL: "https://api.spotify.com/v1/",
    });

    return (async () => {
      await this.authorize();
      return this;
    })();
  }

  async authorize() {
    const authKey = Buffer.from(`${this.clientID}:${this.clientSecret}`).toString("base64");
    try {
      const axiosData = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authKey}`,
          },
        }
      );

      // set token
      const { access_token } = axiosData.data;
      this.axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      this.token = access_token;
    } catch (e) {
      console.error("SPOTIFY ERROR:: Error during authorization:", e.message);
      console.error({
        clientID: this.clientID,
        clientSecret: this.clientSecret,
        authKey,
      });
    }
  }

  async searchTrack(title, artist) {
    try {
      const { data } = await this.axios.get("/search", {
        params: {
          q: `track:${title} artist:${artist}`,
          type: "track",
        },
      });

      const item = data.tracks.items[0];
      return utils.formatSongData(item);
    } catch (e) {
      console.error("SPOTIFY ERROR:: searching for song:", e.message);
      console.error(e.config);
    }
  }
}

async function init() {
  const spotify = await new Spotify(clientID, clientSecret);
  const resp = await spotify.searchTrack("Dont let me down", "The chainsmokers");
  console.log(resp);
}

module.exports = {
  Spotify,
};
