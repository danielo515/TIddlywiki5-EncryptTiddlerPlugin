const gulp = require("gulp");
const sass = require("gulp-sass");
const through = require("through2");
const Vinyl = require("vinyl");
const path = require("path");

sass.compiler = require("sass");
const author = "danielo515";
const plugin = "encryptTiddler";

const tiddlywikiFiles = {
  tiddlers: [],
};

const wikiFile = (name) => ({
  file: name,
  fields: {
    type: "text/vnd.tiddlywiki",
    title: `$:/plugins/${author}/${plugin}/styles/${name}`,
    tags: "[[$:/tags/Stylesheet]]",
  },
});

/**
 * Generates a `tiddlywiki.files` for each css file that is on the stream where this is added.
 * `tiddlywiki.files` is a metadata file that  allows tiddlywiki to 
 * load normal files (ej css) as if they were tiddlers.
 * For now, it only generates one file per file and folder, meaning that
 * multiple css files on the same folder will overwrite each other.
 */
const annotateCss = through.obj(function (file, enc, next) {
  const base = path.join(file.path,'../')
  var first = new Vinyl({
    base: base,
    path: path.join(base, "tiddlywiki.files"),
    contents: Buffer.from(
      JSON.stringify(
        { tiddlers: [wikiFile(path.basename(file.path))] },
        null,
        2
      )
    ),
  });
  console.info("Generated tiddlywiki files for: ", file.path)
  this.push(first);
  next();
});

gulp.task("sass", function () {
  return gulp
    .src("./src/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(annotateCss)
    .pipe(gulp.dest("./css"));
});

gulp.task("sass:watch", function () {
  gulp.watch("./sass/**/*.scss", ["sass"]);
});
