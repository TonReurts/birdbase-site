site_base="/Volumes/Documenten/GitRepositories/birdbase-site"

exiftool \
  -json \
  -r \
  -n \
  -GPSLatitude \
  -GPSLongitude \
  -DateTimeOriginal \
  -Subject \
  -Description \
  -Caption-Abstract \
  -Rating \
  ${site_base}/pictures/ > ${site_base}/data/pictures.json

node ${site_base}/scripts/normalize.js
