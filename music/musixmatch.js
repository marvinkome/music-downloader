const fetch = require("isomorphic-fetch");
const qs = require("querystring");

// musixmatch config
const main_url = "http://api.musixmatch.com/ws/1.1/";
const main_query = {
    apikey: "54166a3d2bc401027ee1eeffd4200abc"
};

function getGenre(title, artist) {
    const query = qs.stringify(
        Object.assign(main_query, {
            q_track: title,
            q_artist: artist
        })
    );
    const url = `${main_url}track.search?${query}`;

    const mixmatch = fetch(url)
        .then(res => res.json())
        .then(res => {
            if (res.message.body.length === 0) return;
            const data = res.message.body.track_list[0].track;

            const pri_genres = data.primary_genres.music_genre_list.reduce(
                (total, curr) => {
                    const genre = curr.music_genre.music_genre_name;
                    total.push(genre);
                    return total;
                },
                []
            );
            const sec_genres = data.secondary_genres.music_genre_list.reduce(
                (total, curr) => {
                    const genre = curr.music_genre.music_genre_name;
                    total.push(genre);
                    return total;
                },
                []
            );

            const genres = pri_genres.concat(sec_genres);

            return {
                genres
            };
        });

    return mixmatch;
}

module.exports = getGenre;
