let currentSong = new Audio();
let songs;
let currFolder;

async function getSongs(folder) {
  songs = [];
  currFolder = folder;
  // let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
  let a = await fetch(`/${folder}/`);

  let response = await a.text();
  let div = document.createElement("div");

  div.innerHTML = response;
  let as = div.getElementsByTagName("a");

  for (let index = 0; index < as.length; index++) {
    const element = as[index];

    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${currFolder}/`)[1]);
    }
  }

  // show all songs

  let songUl = document
    .querySelector(".song-list")
    .getElementsByTagName("ul")[0];
  songUl.innerHTML = "";
  for (let song of songs) {
    songUl.innerHTML =
      songUl.innerHTML +
      `<li>   
      <div class="song-data" >
                  <img class="invert" src="img/music.svg" alt="" srcset="">
                  <div class="info">
                    <div class="song-name">${song.replaceAll("%20", " ")}</div>
                    <div class="artist">Mustafa</div>
                  </div>
                  </div>

                  <div class="play-main">
                    <img src="img/play.svg" alt="" srcset="">
                  </div>
                  
                </li>`;
  }

  // eventListener to song
  Array.from(
    document.querySelector(".song-list").getElementsByTagName("li")
  ).forEach((element) => {
    element.addEventListener("click", (e) => {
      console.log(element.querySelector(".song-name").innerHTML);

      playMusic(element.querySelector(".song-name").innerHTML.trim());
    });
  });

  return songs;
}

const playMusic = (name, pause = false) => {
  // play the song

  currentSong.src = `/${currFolder}/` + name;

  if (!pause) {
    currentSong.play();
    play.src = "img/pause.svg";
  }

  document.querySelector(".song-info").innerHTML = decodeURI(name);

  // update time
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".song-time").innerHTML =
      formatTime(currentSong.currentTime) +
      "/" +
      formatTime(currentSong.duration);

    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // add eventListener to circle

  document.querySelector(".seekbar").addEventListener("click", (e) => {
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
  await getSongs("songs/ncs");

  playMusic(songs[0], true);

  //play and pause

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  //show all albums

  async function showAlbum() {
    // let a = await fetch("http://127.0.0.1:3000/songs/");
    let a = await fetch("/songs/");

    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let alla = div.getElementsByTagName("a");

    let array = Array.from(alla);
    for (let index = 0; index < array.length; index++) {
      const e = array[index];

      // console.log(e.href)
      if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
        let x = e.href.split("/songs/").pop();
        x = x.replaceAll("/", "");

        // meta data

        // let a = await fetch(`http://127.0.0.1:3000/songs/${x}/info.json`);

        let a = await fetch(`/songs/${x}/info.json`);
        let response = await a.json();
        console.log(response);

        let con = document.querySelector(".card-Container");
        con.innerHTML += ` <div data-folder="${x}" class="card">
                <div class="play">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    data-encore-id="icon"
                    role="img"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    class="Svg-sc-ytk21e-0 bneLcE"
                  >
                    <path
                      d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"
                    ></path>
                  </svg>
                </div>
                <img
                  src="/songs/${x}/cover.jpeg"
                  alt=""
                />
                <h2>${response.title}</h2>
                <p>${response.description}</p>
              </div>`;
      }
    }

    // load playlist by card

    Array.from(document.getElementsByClassName("card")).forEach((element) => {
      element.addEventListener("click", async (item) => {
        // console.log(item, item.currentTarget.dataset)
        songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
        playMusic(songs[0])
      });
    });
  }

  showAlbum();

  // open the left side bar

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0%";
  });

  document.querySelector(".close-icon").addEventListener("click", function () {
    document.querySelector(".left").style.left = "-100%";
  });

  // prev and next

  previous.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
    else{
      playMusic(songs[index])
    }
  });

  next.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);

    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
    else{
      playMusic(songs[0])
    }
  });

  // eventListner to range

  volume.addEventListener("change", (e) => {
    currentSong.volume = e.target.value / 100; 
    document.getElementById("vol-svg").style.display = "block"
    document.getElementById("mute-svg").style.display = "none"

  });

  // mute 

  document.getElementById("vol-svg").addEventListener("click", ()=>{
    currentSong.volume = 0;
    volume.value = 0;
        document.getElementById("vol-svg").style.display = "none"
        document.getElementById("mute-svg").style.display = "block"
})


document.getElementById("mute-svg").addEventListener("click", (e)=>{
    currentSong.volume = .1;
    volume.value = 10
    document.getElementById("mute-svg").style.display = "none"
    document.getElementById("vol-svg").style.display = "block"
})

}

main();
