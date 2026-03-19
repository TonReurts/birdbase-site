// scripts/normalize.js
const fs = require("fs");
const raw = require("../data/pictures.json");

// Default GPS coordinates (center of Netherlands)
const DEFAULT_LAT = 52.764803;
const DEFAULT_LNG = 5.377262;

const photos = raw
  .map(p => {
    const file = p.SourceFile;
    const name = file.split("/").pop().replace(".jpg", "");

    const date = p.DateTimeOriginal?.split(" ")[0] ?? null;
    const year = date ? date.slice(0, 4) : null;

    const captivity = p.Description?.includes("Captivity") ?? false;
    if (p.Description?.includes("Man")) {
      gender = "M";
    } else if (p.Description?.includes("Vrouw")) {
      gender = "F";
    } else {
      gender = null;
    }

    return {
      id: name,
      soort: Array.isArray(p.Subject) ? p.Subject[0] : p.Subject,
      beschrijving: p.Description || p["Caption-Abstract"] || "",
      lat: p.GPSLatitude ?? DEFAULT_LAT,
      lng: p.GPSLongitude ?? DEFAULT_LNG,
      datum: date,
      jaar: year,
      bestand: "./" + file,
      captivity: captivity,
      gender: gender,
      rating: p.Rating
    };
  });

fs.writeFileSync(
  "data/photos.json",
  JSON.stringify(photos, null, 2)
);

