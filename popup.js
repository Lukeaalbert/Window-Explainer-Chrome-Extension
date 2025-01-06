const claudePrompt = `
You are a teacher and your job is to briefly and concisely 
teach and explain the topic/content in the provided image to a student.

Please focus on explaining and teaching the specifics of the content in
an image instead of discussing general/broad concepts that relate to the image.

Format Rules:
Return a response in HTML FORMAT ONLY.
Do NOT include an intro such as 'the image shows' or 'here is a brief explanation'.
Use only <p>, <ul>, <li>, <ol>, <strong>, <i> tags.
NO headers.
Do NOT refer to the image as 'this image' or 'the image'.
Do NOT start with 'This contains' 'The image shows', or similar phrases.`;

const ANTHROPIC_API_KEY = "api key";

// Function for extracting only HTML
function extractHTML(rawResponse) {
    // starting at the beginning of the HTML
    const htmlStart = rawResponse.indexOf("<");
    if (htmlStart !== -1) {
        // if HTML is succesfully found, return everything after that first "<"
        return rawResponse.substring(htmlStart).trim();
    }
    else {
        // if HTML is not found, return full text with a warning.
        console.warn("No valid HTML found, returning full text.");
        return rawResponse;
    }
}

document.getElementById("explain_button").addEventListener("click", async function() {
    document.getElementById("response_text").innerHTML = "";
    const loading = document.getElementById("loading");
    loading.style.display = "block";
    loading.style.visibility = "visible";
    var screenshot = await captureTab();
    var canvas = await screenshotToCanvas(screenshot);

    if (canvas) {
        // convert canvas to base64 for claude api call
        var base64 = canvas.toDataURL();

        // base64 originally in form:
        //  data:image/png;base64,l4n23jd33aow....
        // remove the "data:image/png;base64," preface
        base64 = base64.replace("data:image/png;base64,", "");

        // Make the Claude API call with the image
        const ApiResponse = await makeClaudeCall(base64);

        loading.style.display = "none";
        loading.style.visibility = "hidden";

        response = ApiResponse.content[0].text;
        console.log("TESTING: HTML NOT EXTRACTED --> ", response);

        // Extracting HTML
        response = extractHTML(response);
        console.log("TESTING: HTML EXTRACTED --> ", response);

        document.getElementById("response_text").innerHTML = `${response}`;

        requestAnimationFrame(() => {
            document.getElementById("response_text").style.opacity = "1";
        });

    }
    else {
        console.log("error getting canvas");
    }
});

async function captureTab() {
    // get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
        // take the screenshot
        const screenshot = await chrome.tabs.captureVisibleTab();

        return screenshot;
    } catch (err) {
        console.log("Error in captureTab(): ", err);
    }
}


async function screenshotToCanvas(screenshot) {
    try {
    // create image element
        const img = document.createElement('img');
        img.src = screenshot;
        img.style.maxWidth = '100%';

        await new Promise((resolve) => {
            img.onload = resolve;
        });

        // convert img element to canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        // returns HTML canvas element
        return canvas;
    } catch (err) {
        console.log("Error in screenshotToCanvas(): ", err);
    }
}

async function makeClaudeCall(base64) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true', // required header. TODO: switch to Server-Side Proxy for production.
        },
        body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/png',
                            data: base64
                        }
                    },
                    {
                        type: 'text',
                        text: claudePrompt
                    }
                ]
            }]
        })
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`API request failed: ${response.status} , ${responseText}`);
    }

    const data = await response.json();
    
    // Check and access the response content correctly
    if (!data.content) {
        throw new Error('Invalid API response format');
    }

    return data;
}
