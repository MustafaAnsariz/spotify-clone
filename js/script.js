let currentSong = new Audio();
let songs; // This will store the array of song filenames for the current album
let currFolder; // This will store the path to the current album folder (e.g., "songs/ncs")

// --- MODIFIED getSongs function ---
async function getSongs(folderPath) { // folderPath will be like "songs/ncs"
  currFolder = folderPath; //current folder path
  songs = []; // Reset songs array for the new folder

  try {
    // Fetch the songs.json file for the given album folder
    let response = await fetch(`/${folderPath}/songs.json`); 
    
    if (!response.ok) {
      console.error(`Failed to fetch songs.json for ${folderPath}: ${response.statusText}`);
      let songUl = document.querySelector(".song-list").getElementsByTagName("ul")[0];
      songUl.innerHTML = "<li>Error loading songs for this album.</li>";
      return []; // Return empty array on error
    }
    
    songs = await response.json(); // Parse the JSON response (array of song filenames)
  } catch (error) {
    console.error(`Error fetching or parsing songs.json for ${folderPath}:`, error);
    let songUl = document.querySelector(".song-list").getElementsByTagName("ul")[0];
    songUl.innerHTML = "<li>Could not load songs. Check console.</li>";
    return [];
  }

  // Show all songs in the list
  let songUl = document.querySelector(".song-list").getElementsByTagName("ul")[0];
  songUl.innerHTML = ""; // Clear previous song list

  if (songs.length === 0) {
    songUl.innerHTML = "<li>No songs found in this album.</li>";
  } else {
    for (const songFile of songs) {
      // songFile is just the filename, e.g., "Your Eyes.mp3"
      const displayName = songFile.replaceAll("%20", " ").replace(/\.mp3$/i, ""); // Clean name for display
      songUl.innerHTML += `
        <li data-songfile="${songFile}"> 
          <div class="song-data">
            <img class="invert" src="Img/music.svg" alt="">
            <div class="info">
              <div class="song-name">${displayName}</div>
              <div class="artist">Mustafa</div> 
            </div>
          </div>
          <div class="play-main">
            <img src="Img/play.svg" alt="">
          </div>
        </li>`;
    }
  }

  // Add eventListener to each song in the list
  Array.from(songUl.getElementsByTagName("li")).forEach((element) => {
    element.addEventListener("click", (e) => {
      const songToPlay = element.dataset.songfile; // Get filename from data attribute
      if (songToPlay) {
        playMusic(songToPlay);
      }
    });
  });

  return songs; // Return the array of song filenames
}


const playMusic = (songFilename, pause = false) => {
  if (!songFilename) { // Handle cases where no song name is provided
    console.warn("playMusic called with no songFilename");
    currentSong.pause();
    play.src = "Img/play.svg";
    document.querySelector(".song-info").innerHTML = "No song selected";
    document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
    document.querySelector(".circle").style.left = "0%";
    return;
  }

  // currFolder is already set by getSongs (e.g., "songs/ncs")
  // songFilename is just the filename (e.g., "Invisible.mp3")
  currentSong.src = `/${currFolder}/${songFilename}`;

  if (!pause) {
    currentSong.play().catch(e => console.error("Error playing audio:", e)); // Added catch for play promise
    play.src = "Img/pause.svg";
  } else {
    // If pause is true, we just load the song but don't play it.
    // The UI for play button should reflect that it's ready to play (showing play icon).
    play.src = "Img/play.svg";
  }

  document.querySelector(".song-info").innerHTML = decodeURI(songFilename.replace(/\.mp3$/i, ""));

  // update time
  currentSong.addEventListener("timeupdate", () => {
    if (isNaN(currentSong.duration)) { // Handle cases where duration is not yet available
        document.querySelector(".song-time").innerHTML = formatTime(currentSong.currentTime) + " / --:--";
        document.querySelector(".circle").style.left = "0%";
    } else {
        document.querySelector(".song-time").innerHTML =
        formatTime(currentSong.currentTime) +
        " / " +
        formatTime(currentSong.duration);
        document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
  });

  // add eventListener to circle
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    if (isNaN(currentSong.duration)) return; // Don't seek if duration is unknown
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });
};

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

async function main() {
  // The initial call to getSongs now needs the full path
  // Let's load the first album from your albums_manifest.json by default after fetching the manifest
  await showAlbum(); // showAlbum will also load the first album's songs if successful

  // Play and pause event listener (remains the same)
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play().catch(e => console.error("Error playing audio:", e));
      play.src = "Img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "Img/play.svg";
    }
  });

  // --- MODIFIED showAlbum function ---
  async function showAlbum() {
    let albumsData;
    try {
      // Fetch the albums_manifest.json from the root
      let response = await fetch("/albums_manifest.json"); 
      if (!response.ok) {
        console.error(`Failed to fetch albums_manifest.json: ${response.statusText}`);
        document.querySelector(".card-Container").innerHTML = "<p>Error loading albums. Manifest not found.</p>";
        return;
      }
      albumsData = await response.json();
    } catch (error) {
      console.error("Error fetching or parsing albums_manifest.json:", error);
      document.querySelector(".card-Container").innerHTML = "<p>Could not load albums. Check console.</p>";
      return;
    }
    
    let cardContainer = document.querySelector(".card-Container");
    cardContainer.innerHTML = ""; // Clear existing cards

    let firstAlbumPath = null; // To load songs from the first album by default

    for (const albumEntry of albumsData) {
      // albumEntry is like { "id": "ncs", "path": "songs/ncs" }
      
      if (!firstAlbumPath) {
          firstAlbumPath = albumEntry.path; // Store path of the first album
      }

      // Fetch the specific info.json for this album's title and description
      let albumInfo = { title: "Unknown Album", description: "No description available." }; // Defaults
      try {
        let infoResponse = await fetch(`/${albumEntry.path}/info.json`);
        if (infoResponse.ok) {
          albumInfo = await infoResponse.json();
        } else {
          console.warn(`Could not load info.json for ${albumEntry.path}: ${infoResponse.statusText}`);
        }
      } catch (error) {
          console.warn(`Error fetching info.json for ${albumEntry.path}:`, error);
      }

      cardContainer.innerHTML += `
        <div data-folder="${albumEntry.path}" class="card">
          <div class="play">
            <svg xmlns="http://www.w3.org/2000/svg" data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 24 24" class="Svg-sc-ytk21e-0 bneLcE">
              <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
            </svg>
          </div>
          <img src="/${albumEntry.path}/cover.jpeg" alt="${albumInfo.title || 'Cover'}"/>
          <h2>${albumInfo.title}</h2>
          <p>${albumInfo.description}</p>
        </div>`;
    }

    // Load playlist by card click
    Array.from(document.getElementsByClassName("card")).forEach((element) => {
      element.addEventListener("click", async (item) => {
        document.querySelector(".left").style.left = "0%";
        // item.currentTarget.dataset.folder will be "songs/ncs", "songs/love", etc.
        let loadedSongs = await getSongs(item.currentTarget.dataset.folder); 
        if (loadedSongs && loadedSongs.length > 0) {
          playMusic(loadedSongs[0]); // Play the first song of the clicked album
        } else {
          playMusic(null, true); // Handle empty or error in loading songs
        }
      });
    });

    // After showing albums, if we have a first album, load its songs and prepare the first song
    if (firstAlbumPath) {
        let initialSongs = await getSongs(firstAlbumPath);
        if (initialSongs && initialSongs.length > 0) {
            playMusic(initialSongs[0], true); // Load the first song of the first album, but don't auto-play
        } else {
            playMusic(null, true); // Handle case where first album has no songs or error
        }
    } else if (albumsData && albumsData.length === 0) {
        // No albums found in manifest
        document.querySelector(".song-list").getElementsByTagName("ul")[0].innerHTML = "<li>No albums found. Add albums to albums_manifest.json.</li>";
        playMusic(null, true);
    }
  }

  // Hamburger menu and close icon (remains the same)
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0%";
  });
  document.querySelector(".close-icon").addEventListener("click", function () {
    document.querySelector(".left").style.left = "-100%";
  });

  // Previous and next button logic (remains largely the same, ensure `songs` array is correctly populated)
  previous.addEventListener("click", () => {
    if (!songs || songs.length === 0) return;
    let currentFilename = currentSong.src.split("/").pop(); // Get filename from full src URL
    let index = songs.indexOf(currentFilename);
    if (index > 0) { // Check if index is found and not the first song
      playMusic(songs[index - 1]);
    } else if (index === 0 && songs.length > 1) { // If it's the first song, play the last song (optional wrap-around)
      playMusic(songs[songs.length - 1]);
    } else if (index === -1 && songs.length > 0){ // If current song not in list, play first song
        playMusic(songs[0]);
    }
    // If index is 0 and only one song, or index is -1 and no songs, do nothing or play current
  });

  next.addEventListener("click", () => {
    if (!songs || songs.length === 0) return;
    // currentSong.pause(); // Pausing here might be jarring if it's already paused
    let currentFilename = currentSong.src.split("/").pop();
    let index = songs.indexOf(currentFilename);

    if (index !== -1 && index + 1 < songs.length) { // Check if index is found and not the last song
      playMusic(songs[index + 1]);
    } else if (index !== -1 && songs.length > 0) { // If it's the last song or current song not found, play the first song
      playMusic(songs[0]);
    }
  });

  // EventListener to volume range (remains the same)
  volume.addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.volume > 0) {
        document.getElementById("vol-svg").style.display = "block";
        document.getElementById("mute-svg").style.display = "none";
    } else {
        document.getElementById("vol-svg").style.display = "none";
        document.getElementById("mute-svg").style.display = "block";
    }
  });

  // Mute functionality (remains the same, but added check for initial volume.value)
   if(volume.value == 0){
    document.getElementById("vol-svg").style.display = "none";
    document.getElementById("mute-svg").style.display = "block";
  }

  document.getElementById("vol-svg").addEventListener("click", () => {
    currentSong.muted = true; // Use the muted property for clarity
    volume.value = 0;
    document.getElementById("vol-svg").style.display = "none";
    document.getElementById("mute-svg").style.display = "block";
  });

  document.getElementById("mute-svg").addEventListener("click", (e) => {
    currentSong.muted = false;
    currentSong.volume = 0.1; // Set a default volume when unmuting
    volume.value = 10;
    document.getElementById("mute-svg").style.display = "none";
    document.getElementById("vol-svg").style.display = "block";
  });
}

main();
