document.getElementById("explain_button").addEventListener("click", async function() {
    var canvas = await captureTab();

    if (canvas) {
        // convert canvas to base64 for claude api call
        // note: next step is to simply make the claude api call, specifying 
        // png image type and passing in this base64 string for the data param
        const base64 = canvas.toDataURL();
        console.log(base64);
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
        console.log("Error in captureTab(): ", err);
    }
}

