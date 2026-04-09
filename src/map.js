let allPhotos = [];
let wildFilterActive = true;
let genderFilter = "-"; // "-", "♂", "♀"
let ratingFilter = 5; // Initially show 5 star and higher ratings

const searchInput = document.getElementById("search");
const wildFilterBtn = document.getElementById("wild-filter");
const genderFilterBtn = document.getElementById("gender-filter");
const ratingFilterBtn = document.getElementById("rating-filter");
const progressBtn = document.getElementById("progress");

// Map gender symbols to potential data formats
const getGenderMatch = (gender, filterValue) => {
  if (filterValue === "-") return true;
  if (filterValue === "♂") return gender === "M";
  if (filterValue === "♀") return gender === "F";
  return false;
};

// Filter function that applies all active filters
const applyAllFilters = (query = "") => {
  const finalQuery = query || searchInput.value.trim().toLowerCase();
  const filtered = allPhotos.filter(photo => {
    const matchesSearch = !finalQuery || (photo.soort && photo.soort.toLowerCase().includes(finalQuery));
    const matchesWild = !wildFilterActive || photo.captivity === false;
    const matchesGender = getGenderMatch(photo.gender, genderFilter);
    const matchesRating = photo.rating >= ratingFilter;
    return matchesSearch && matchesWild && matchesGender && matchesRating;
  });
  renderMarkers(filtered);
};

searchInput.addEventListener("input", () => {
  applyAllFilters();
});

// Wild filter button
if (wildFilterBtn) {
  // Initialize active state on page load
  wildFilterBtn.classList.toggle("active", wildFilterActive);
  
  wildFilterBtn.addEventListener("click", () => {
    wildFilterActive = !wildFilterActive;
    wildFilterBtn.classList.toggle("active", wildFilterActive);
    applyAllFilters();
  });
}

// Gender filter button
if (genderFilterBtn) {
  genderFilterBtn.addEventListener("click", () => {
    const genders = ["-", "♂", "♀"];
    const currentIndex = genders.indexOf(genderFilter);
    genderFilter = genders[(currentIndex + 1) % genders.length];
    genderFilterBtn.textContent = genderFilter;
    genderFilterBtn.classList.toggle("active", genderFilter !== "-");
    applyAllFilters();
  });
}

// Rating filter button
if (ratingFilterBtn) {
  // Initialize button text
  ratingFilterBtn.textContent = ratingFilter;
  ratingFilterBtn.classList.toggle("active", ratingFilter !== 5);
  
  ratingFilterBtn.addEventListener("click", () => {
    const ratings = [5, 4, 3];
    const currentIndex = ratings.indexOf(ratingFilter);
    ratingFilter = ratings[(currentIndex + 1) % ratings.length];
    ratingFilterBtn.textContent = ratingFilter;
    ratingFilterBtn.classList.toggle("active", ratingFilter !== 5);
    applyAllFilters();
  });
}

// 1. Kaart initialiseren (tijdelijk midden NL)
const map = L.map("map", {
  zoomControl: true
}).setView([52.1, 5.1], 8);

// 2. Tegels (OpenStreetMap)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap"
}).addTo(map);

// 3. Marker cluster groep
const markers = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 50
});

map.addLayer(markers);

// 4. Huidige locatie bepalen
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 12);
    },
    () => {
      console.warn("Locatie niet beschikbaar, standaard locatie gebruikt");
    }
  );
}

// 5. Foto data laden
fetch("./data/photos.json")
  .then(res => res.json())
  .then(photos => {
    allPhotos = photos;
    applyAllFilters();
  })
  .catch(err => console.error("Fout bij laden foto data", err));


function renderMarkers(photos) {
    markers.clearLayers();
    photos.forEach(photo => {
      const marker = L.marker([photo.lat, photo.lng]);

      const popup = `
        <strong>${photo.soort}</strong><br>
        <img
          class="popup-thumb"
          data-full="${photo.bestand}"
          src="${photo.bestand}"
          alt="${photo.soort}"
          style="width:100%;max-width:200px;margin-top:4px;cursor:pointer;"
        />
      `;

      marker.bindPopup(popup);
      markers.addLayer(marker);
    });
  }

// Modal / big photo handling
const photoModal = document.getElementById("photo-modal");
const photoModalImg = document.getElementById("photo-modal-img");
const photoModalClose = document.getElementById("photo-modal-close");

function openPhoto(url) {
  if (!photoModal || !photoModalImg) return window.open(url, "_blank");
  
  // Load image to detect dimensions
  const img = new Image();
  img.onload = function() {
    photoModalImg.src = url;
    photoModal.classList.add("open");
    photoModal.setAttribute("aria-hidden", "false");
    
    // Detect landscape images (width > height)
    const isLandscape = img.width > img.height;
    photoModal.classList.toggle("landscape", isLandscape);
    
    // Disable screen rotation for landscape images
    if (isLandscape && screen.orientation?.lock) {
      screen.orientation.lock('landscape').catch(err => console.log('Screen lock failed:', err));
    }
    
    // Hide UI elements
    document.getElementById("search")?.classList.add("hidden");
    document.getElementById("wild-filter")?.classList.add("hidden");
    document.getElementById("gender-filter")?.classList.add("hidden");
    document.getElementById("rating-filter")?.classList.add("hidden");
    document.getElementById("progress")?.classList.add("hidden");
    document.body.style.overflow = "hidden";
  };
  img.onerror = function() {
    // Fallback if image fails to load
    photoModalImg.src = url;
    photoModal.classList.add("open");
    photoModal.setAttribute("aria-hidden", "false");
  };
  img.src = url;
}

function closePhoto() {
  if (!photoModal) return;
  photoModal.classList.remove("open");
  photoModal.classList.remove("landscape");
  photoModal.setAttribute("aria-hidden", "true");
  if (photoModalImg) photoModalImg.src = "";
  
  // Show UI elements
  document.getElementById("search")?.classList.remove("hidden");
  document.getElementById("wild-filter")?.classList.remove("hidden");
  document.getElementById("gender-filter")?.classList.remove("hidden");
  document.getElementById("rating-filter")?.classList.remove("hidden");
  document.getElementById("progress")?.classList.remove("hidden");
  document.body.style.overflow = "";
  
  // Re-enable screen rotation
  if (screen.orientation?.unlock) {
    screen.orientation.unlock();
  }
}

if (photoModalClose) photoModalClose.addEventListener("click", closePhoto);
if (photoModal) {
  photoModal.addEventListener("click", e => {
    if (e.target === photoModal) closePhoto();
  });
}

// When a popup opens, wire its thumbnail click to the modal
map.on("popupopen", e => {
  try {
    const popupEl = e.popup.getElement();
    if (!popupEl) return;
    const thumb = popupEl.querySelector(".popup-thumb");
    if (thumb) {
      thumb.addEventListener("click", () => openPhoto(thumb.dataset.full));
    }
  } catch (err) {
    // ignore
  }
});
