async function fetchData(bodyElement) {
    const selectedFiles = await eagle.item.getSelected();

    const selectedFolders = await eagle.folder.getSelected();
    const isOneFolder = selectedFolders.length == 1;

    const hasMultipleFilesBoolean = selectedFiles.length > 1;
    const selectedIsZipFile = await selectedFiles[0].filePath.endsWith(".zip");

    if (hasMultipleFilesBoolean && isOneFolder && await folderHasParent(selectedFolders[0])) {
        console.log("mode: multifile");
        const compressButton = document.createElement("button");
        compressButton.textContent = "Compress";
        compressButton.addEventListener("click", () => {
            compressSelectedFiles();
        });
        bodyElement.appendChild(compressButton);
    } else if (
        selectedIsZipFile 
        && isOneFolder 
        && selectedFiles.length == 1
        
    ) {
        console.log("mode: zip");
        const extractButton = document.createElement("button");
        extractButton.textContent = "Extract";
        extractButton.addEventListener("click", () => {
            extractZipFiles();
        });
        bodyElement.appendChild(extractButton);

        // append br
        const br = document.createElement("br");
        bodyElement.appendChild(br);

        const copyFileNamesButton = document.createElement("button");
        copyFileNamesButton.textContent = "Copy File Names";
        copyFileNamesButton.addEventListener("click", () => {
            copyZipFileNames();
        });
        bodyElement.appendChild(copyFileNamesButton);
    } else {
        console.log("mode: unsupported");
        const notSupportedButton = document.createElement("button");
        notSupportedButton.textContent = "Not supported";
        notSupportedButton.disabled = true;
        bodyElement.appendChild(notSupportedButton);
    }

    // query all buttons and set the attribute to theme
    const theme = await eagle.app.theme;
    const buttons = document.querySelectorAll("button");
    buttons.forEach((btn) => {
        btn.setAttribute("theme", theme);
    });
}
