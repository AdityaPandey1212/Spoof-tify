const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Scraper = require('youtube-search-scraper').default;
const app = express();
const env = require('dotenv').config();
const youtube = new Scraper();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON
// get client id and client sec from environment variable
const clientID = process.env.CLIENT_ID;
const clientSec = process.env.CLIENT_SEC;
const rapidapi = process.env.RAPIDAPI;
let token = '';
// Function to fetch Spotify playlist data
async function fetchData(playlistID) {
    try {
        if (playlistID) {
            const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (playlistResponse.ok) {
                return await playlistResponse.json();
            } else {
                console.error('Failed to fetch playlist:', playlistResponse.status);
                return null;
            }
        } else {
            console.error('Invalid playlist URL');
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
// Function to extract playlist ID from URL
function extractPlaylistId(playlistUrl) {
    const regex = /playlist\/([^/?]+)/;
    const match = regex.exec(playlistUrl);
    return match ? match[1] : null;
}
// Function to fetch MP3s
async function fetchMP3s(id) {
    const options = {
        method: 'GET',
        url: 'https://youtube-mp36.p.rapidapi.com/dl',
        params: { id: id },
        headers: {
            'X-RapidAPI-Key': rapidapi,
            'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
        }
    };
    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
} 
// Function to search for a video
async function search(query) {
    const results = await youtube.search(query);
    return results.videos[0];
}
// Route to handle playlist requests
app.get('/', async (req, res) => {
    console.log("Request received");
    const playlistUrl = req.query.link;
    if (!playlistUrl) {
        return res.send('Hello! This API fetches songs from a Spotify playlist. Please provide a playlist URL as a query parameter. clientTest: ' + clientID+ clientSec + token);
    }
    const playlistID = extractPlaylistId(playlistUrl);
    if (!playlistID) {
        return res.status(400).json({ error: 'Invalid playlist URL' });
    }
    const data = await fetchData(playlistID);
    if (!data) {
        return res.status(500).json({ error: 'Failed to fetch playlist data' });
    }
    let imgUrls = "";
    if (data.images.length == 1) {
        imgUrls = data.images[0].url;
    } else {
        imgUrls = data.images[1].url;
    }
    //playlist image, the second largest one, index 0 -> largest, 1-> medium, 2-> smallest  
    const playlistName = data.name;
    const playlistInfo = {
        name: playlistName,
        images: imgUrls
    };
    try {
        const sendAsResponse = await Promise.all(data.tracks.items.map(async (item) => {
            const songName = item.track.name;
            const imageUrl = item.track.album.images[2].url;
            const video = await search(songName + ' lyrics');
            const songlink = await fetchMP3s(video.id);
            return { songName, imageUrl, songlink };
        }));

        res.json({playlistInfo, sendAsResponse});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process song data' });
    }
});
// Function to get Spotify token
async function getToken(clientID, clientSec) {
    console.log("Getting token");
    try {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${clientID}&client_secret=${clientSec}`
        })
        .catch((error) => {
            console.error('Error getting token:', error);
            return null;
        });
        const data = await result.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}
// Start the server
app.listen(3000, async () => {
    console.log('Server started');
    token = await getToken(clientID, clientSec);
});
