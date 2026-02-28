let isRequestInFlight = false;

function fetchResults(event) {
    if (event) event.preventDefault();
    if (isRequestInFlight) return;

    const chatInput = document.getElementById("text-input").value.trim();
    if (!chatInput) return;

    document.getElementById("input").innerText = chatInput;
    fetchApiResponse(chatInput);
}

let inputarr = [];
let outputarr = [];

async function fetchApiResponse(chat) {
    isRequestInFlight = true;
    const sendBtn = document.getElementById("send-message-button");
    if (sendBtn) sendBtn.disabled = true;
    document.getElementById("response").innerText = "Loading Please Wait .....";
    try {
        // Route requests through a local proxy to keep the API key off the client.
        const url = 'http://localhost:3000/api/generate';
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: chat,
                        }
                    ]
                }
            ]
        };

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };

        const resp = await fetch(url, options);

        // Check HTTP status
        if (resp.status === 429) {
            const raw = await resp.text();
            console.error('API quota/rate-limit error', raw);
            document.getElementById("response").innerText = "API error 429: quota/rate limit reached. Wait 1-2 minutes and try again. If it continues, check your Google AI Studio quota/billing or create a new API key.";
            return;
        }

        if (!resp.ok) {
            const raw = await resp.text();
            console.error('API HTTP error', resp.status, raw);
            document.getElementById("response").innerText = `API error: ${resp.status}`;
            return;
        }

        const response = await resp.json();
        console.log('Full API response:', response);
        // Check if response has expected structure
        if (
            response.candidates &&
            response.candidates[0] &&
            response.candidates[0].content &&
            response.candidates[0].content.parts &&
            response.candidates[0].content.parts[0] &&
            response.candidates[0].content.parts[0].text
        ) {
            document.getElementById("response").innerText = response.candidates[0].content.parts[0].text;
            outputarr.push(response.candidates[0].content.parts[0].text);
        } else {
            document.getElementById("response").innerText = "No response from API.";
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        // Provide actionable guidance when the proxy is unreachable
        const hint = (msg === 'Failed to fetch' || msg.includes('NetworkError'))
            ? '\nPossible cause: proxy not running or blocked. Start the proxy and open the page via http://localhost:3000 instead of file://.'
            : '';
        document.getElementById("response").innerText = `Error fetching response: ${msg}${hint}`;
        console.error('Fetch error:', error);
    } finally {
        isRequestInFlight = false;
        if (sendBtn) sendBtn.disabled = false;
    }
}

const chatBox = document.getElementById("chat-area");

function AppendMessage(sender, chat) {
    const msgElement = document.createElement("div");
    msgElement.className = `${sender}`;
    msgElement.innerHTML = `<p>${chat}</p>`;
    chatBox.appendChild(msgElement); // Add message to chat area
}