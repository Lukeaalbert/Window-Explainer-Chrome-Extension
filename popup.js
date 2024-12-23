document.getElementById("explain_button").addEventListener("click", async function() {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Take the screenshot
    try {
        const screenshot = await chrome.tabs.captureVisibleTab();
        
        // Create an image element to display the screenshot
        const img = document.createElement('img');
        img.src = screenshot;
        img.style.maxWidth = '100%';
        
        // Display the screenshot in the popup
        document.getElementById("test").innerHTML = '';
        document.getElementById("test").appendChild(img);
    } catch (err) {
        document.getElementById("test").innerHTML = `<p>Error: ${err.message}</p>`;
    }
});