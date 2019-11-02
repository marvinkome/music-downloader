const ID3 = require("browser-id3-writer");
const fs = require("fs");
const path = require("path");
const utils = require("../utils");

async function writeTag(songPath, data, options) {
    // get the song buffer
    const songBuffer = fs.readFileSync(songPath);
    const writer = new ID3(songBuffer);

    // download and set cover art
    if (data.cover_art) {
        console.log("META INFO:: Downloading cover art");

        // get file path
        const filePath = path.join(options.downloadPath, `cover-arts/${data.title}.jpg`);

        // download file
        await utils.downloadFile(data.cover_art, filePath);
        const coverBuffer = fs.readFileSync(filePath);

        console.log("META INFO:: Download finished");

        // add cover file to meta
        console.log("META INFO:: Adding cover art");
        writer.setFrame("APIC", {
            type: 3,
            data: coverBuffer,
            description: "Super picture"
        });
    }

    console.log("META INFO:: Writing tags", data);

    // set data
    data.album && writer.setFrame("TALB", data.album);
    data.title && writer.setFrame("TIT2", data.title);
    data.year && writer.setFrame("TYER", Number(data.year));
    data.disk_number && writer.setFrame("TPOS", data.disk_number);
    data.track_numer && writer.setFrame("TRCK", data.track_numer);
    data.artists && writer.setFrame("TPE1", data.artists);

    writer.addTag();

    const taggedSong = Buffer.from(writer.arrayBuffer);
    fs.writeFileSync(songPath, taggedSong);

    console.log("META INFO:: Finished writing tags");
}

module.exports = { writeTag };
