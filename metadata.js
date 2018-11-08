const ID3 = require("browser-id3-writer");
const fs = require("fs");
const path = require("path");
const fetch = require("isomorphic-fetch");

async function download(url, filename) {
    const res = await fetch(url);
    await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filename);
        res.body.pipe(fileStream);
        res.body.on("error", err => {
            reject(err);
        });
        fileStream.on("finish", function() {
            resolve();
        });
    });
}

async function writeTag(songPath, data) {
    // get the song buffer
    const songBuffer = fs.readFileSync(songPath);
    const writer = new ID3(songBuffer);

    // download cover art
    if (data.cover_art) {
        console.log("downloading cover art");
        await download(
            data.cover_art,
            path.join(__dirname, `./music_img/${data.title}.jpg`)
        );

        const coverBuffer = fs.readFileSync(`./music_img/${data.title}.jpg`);

        console.log("download finished");
        writer.setFrame("APIC", {
            type: 3,
            data: coverBuffer,
            description: "Super picture"
        });
    }

    console.log("writing tags", data);
    // set data
    data.album && writer.setFrame("TALB", data.album);
    data.title && writer.setFrame("TIT2", data.title);
    data.year && writer.setFrame("TYER", Number(data.year));
    data.disk_number && writer.setFrame("TPOS", data.disk_number);
    data.track_numer && writer.setFrame("TRCK", data.track_numer);
    data.genres.length && writer.setFrame("TCON", data.genres);
    data.artists.length && writer.setFrame("TPE1", data.artists);

    writer.addTag();

    const taggedSong = Buffer.from(writer.arrayBuffer);
    fs.writeFileSync(songPath, taggedSong);
    console.log("finished writing tags");
}

module.exports = writeTag;
