const input = document.getElementById("linkIP");
// THIS REMOVES ALL THE PREVIOUS CONTENT (if any)
async function removal() {
    const pli = document.getElementById("playlistImg");
    const songList = document.getElementById("songList");
    const tit = document.getElementById('tit');
    pli.innerHTML = "";
    songList.innerHTML = "";
    tit.innerHTML = "";
}
//this extracts song names from the data fetched and then it adds them to the DOM
async function elementAddition(APIresponse) {
    // Iterate through each song in the data
    APIresponse.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("songListContent");

        const image = document.createElement("img");
        image.src = item.imageUrl; // Use provided image URL
        const span = document.createElement("span");

        const songName = document.createElement("p");
        songName.innerText = item.songName;

        // Truncate song name if length is greater than 11
        if (songName.innerText.length > 11) {
            songName.innerText = songName.innerText.substring(0, 11) + "...";
        }

        span.appendChild(image);
        span.appendChild(songName);
        div.appendChild(span);

        const audio = document.createElement("audio");
        audio.classList.add("audio_element");
        audio.controls = true;
        audio.src = item.songlink.link; // Use provided song link
        div.appendChild(audio);

        // Create and append download button
        const downloadButtonlink = document.createElement("a");
        const downloadButton = document.createElement("button");
        downloadButtonlink.href = item.songlink.link;
        downloadButtonlink.innerText = "Download";
        downloadButtonlink.classList.add("btn2");
        div.appendChild(downloadButtonlink);

        songList.appendChild(div); // Add the div to the DOM
    });
}
// uses a 3rd party api to get downloadable links from the youtube ID we fetched

//this is the main function that is called when the enter key is pressed
document.addEventListener("keydown", async function (event) {
    if (event.key === 'Enter') {
        const playlistUrl = input.value;
        await removal();
        const {playlistInfo , sendAsResponse} = await fetch(`http://localhost:3000/?link=${playlistUrl}`).then(response => response.json());
        console.log(playlistInfo);
        console.log(sendAsResponse);
        const playlistName = playlistInfo.name;
        //add elements into the DOM
        const img = document.createElement("img");
        img.src = playlistInfo.images;
        document.getElementById("playlistImg").appendChild(img);
        document.getElementById("tit").innerText = playlistName;
        const songList = document.getElementById("songList");
        await elementAddition(sendAsResponse);
    }
});