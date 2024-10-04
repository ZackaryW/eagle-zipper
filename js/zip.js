const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const zipCache = {};

async function loadZipFile() {

    const selectedFiles = await eagle.item.getSelected();

    if (!selectedFiles || selectedFiles.length === 0) {
        alert("No file selected.");
        return;
    }
    if (selectedFiles.length > 1) {
        alert("Multiple files selected.");
        return;
    }
    if (!selectedFiles[0].filePath.endsWith(".zip")) {
        alert("Selected file is not a zip file.");
        return;
    }
    const zipFilePath = selectedFiles[0].filePath;

    //check cache
    if (zipCache[zipFilePath]) {
        return zipCache[zipFilePath];
    }

    const zip = new JSZip();

    // Read the zip file
    const zipData = await fs.readFile(zipFilePath);

    // check if zip size >= 100mb
    if (zipData.length >= 100 * 1024 * 1024) {
        await eagle.notification.show({
            title: "Zip file too large",
            message: "Zip file is too large and might lead to memory issues.",
            duration: 5000,
        });
    }

    // Load the zip file content
    await zip.loadAsync(zipData);

    // check if contains sub folders
    const contents = await zip.folder("*");
    //loop map
    for (const [fileName, file] of Object.entries(contents.files)) {
        if (fileName === "*/") {
            continue;
        }

        if (fileName.startsWith(".")) {
            console.error("Found hidden file in zip file: " + fileName);
            return;
        }
        if (file.dir) {
            console.error("Found sub folder in zip file: " + fileName);
            return;
        }
    }

    // Cache the zip object
    zipCache[zipFilePath] = zip;

    return zip;
}

async function copyZipFileNames() {
    try {
        const zip = await loadZipFile();
        let fileNames = Object.keys(zip.files);

		//filter out ones that start with *
		fileNames = fileNames.filter((fileName) => !fileName.startsWith("*"));
        // copy to clipboard
        await eagle.clipboard.writeText(fileNames.join("\n"));
        await eagle.notification.show({
            title: "Copied to clipboard",
            body: "Copied " + fileNames.length + " file names to clipboard.",
            mute: false,
            duration: 3000,
        });
    } catch (error) {
        console.error("Error showing zip contents:", error);
        await eagle.notification.show({
            title: "Error",
            body: "Failed to list zip contents. Please check the console for details.",
            mute: false,
            duration: 3000,
        });
    }
}

async function extractZipFiles() {
    const zip = await loadZipFile();
    const selectedFiles = await eagle.item.getSelected();
    const selectedFolders = await eagle.folder.getSelected();

	if (!selectedFiles && !selectedFolders){
		return;
	}

    // resolve target folder
    let targetFolder = await getChildFolder(selectedFolders[0], selectedFiles[0].name);
    if (!targetFolder) {
        targetFolder = await eagle.folder.createSubfolder(
            selectedFolders[0].id,
            {
                name: selectedFiles[0].name,
                description: selectedFiles[0].notes,
            }
        );
    }
    // unzip to temporary directory
    const tempZip = new TempZip(zip);

    await tempZip.withTempDir(async (tempDir) => {
        for (const [fileName, filePath] of Object.entries(tempDir.files)) {
            await eagle.item.addFromPath(filePath, {
                folders: [targetFolder.id],
                name: fileName,
            });
        }
    });

    // target folder refresh thumbnail
    await eagle.folder.refreshThumbnail();
}

async function compressSelectedFiles() {
    const selectedFolder = await getCurrentFolder();
	const zipName = selectedFolder.name + ".zip";
	const tempZipPath = path.join(os.tmpdir(), zipName);
	console.log("set temp zip path as:" + tempZipPath);
    try {
        const selectedFiles = await eagle.item.getSelected();

        const zip = new JSZip();

        for (const file of selectedFiles) {
            const filePath = await file.filePath;
            const fileContent = await fs.readFile(filePath);
            zip.file(file.name+"."+file.ext, fileContent);
        }
        const zipContent = await zip.generateAsync({ type: "uint8array" });

        await fs.writeFile(tempZipPath, zipContent);

		const parentFolder = await folderGetParent(selectedFolder);

        await eagle.item.addFromPath(tempZipPath, {

            folders: [parentFolder.id],
            name: zipName,
            tags: ["compressed"],
        });

        await eagle.notification.show({
            title: "Compression Complete",
            body: `Created ${zipName} with ${selectedFiles.length} files`,
            mute: false,
            duration: 3000,
        });
    } catch (error) {
        console.error("Error compressing files:", error);
        await eagle.notification.show({
            title: "Error",
            body: "Failed to compress files. Please check the console for details.",
            mute: false,
            duration: 3000,
        });
    } finally {
        //cleanup if temp file exists
        if (fs.existsSync(tempZipPath)) {
            fs.unlinkSync(tempZipPath);
			//delete
			console.log("deleted temp zip file");
        }
    }
}

module.exports = {
    loadZipFile,
    copyZipFileNames,
    extractZipFiles,
    compressSelectedFiles,
};
