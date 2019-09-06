const fs = require("fs");
const path = require("path");
const fetch = require("isomorphic-fetch");

function formatSongData(item) {
    const data = {
        album: item.album.name,
        artists: item.artists.reduce((a, c) => {
            a.push(c.name);
            return a;
        }, []),

        disc_number: item.disc_number,
        title: item.name,
        track_number: item.track_number,
        cover_art: item.album.images.find(i => i.height === 640).url,
        year: item.album.release_date.split("-")[0]
    };

    return data;
}

function checkLastFile() {}

function checkFileExists(filePath) {
    return new Promise(resolve => {
        let watcher = null;

        // first check if file exists
        fs.access(filePath, fs.constants.R_OK, function(err) {
            if (!err) {
                done = true;
                watcher && watcher.close();
                resolve();
            }
        });

        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        watcher = fs.watch(dir, function(eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                done = true;
                watcher.close();
                resolve();
            }
        });
    });
}

function checkFileDoesNotExistsWithTimeout(filePath, timeout) {
    return new Promise(function(resolve, reject) {
        // set timeout
        const timer = setTimeout(() => {
            watcher.close();
            reject(new Error("File wasn't deleted before during the timeout."));
        }, timeout);

        // check if file exists
        fs.access(filePath, fs.constants.F_OK, function(err) {
            if (err) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });

        var dir = path.dirname(filePath);
        var basename = path.basename(filePath);
        var watcher = fs.watch(dir, function(eventType, filename) {
            if (eventType === "rename" && filename !== basename) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });
    });
}

async function downloadFile(url, filename) {
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

module.exports = {
    formatSongData,
    checkFileExists,
    checkFileDoesNotExistsWithTimeout,
    downloadFile
};
