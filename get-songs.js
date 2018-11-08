const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Walks through supplied directory and returns the file tree
 *
 * @param dir {string} Directory to sort
 * @param filelist {array} files
 * @return filelist {array} files in dir.
 */
function walk(dir, filelist) {
    files = fs.readdirSync(dir);
    filelist = filelist || [];

    files.map(file => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            // filelist = walk(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });

    return filelist;
}

function getSongDetails(filepath) {
    const list = filepath.split("/");
    const name = list[list.length - 1];
    const title = name.split("_")[0];
    const artist = name.split("_")[1].split(".")[0];

    return { artist, title, path: filepath };
}

function main() {
    const home = os.homedir();
    const dir_files = walk(`${home}/Music/todo`);

    const songs = dir_files.map(file => getSongDetails(file));
    return songs;
}

module.exports = main;
