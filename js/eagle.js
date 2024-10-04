
async function getCurrentFolder() {
    const currentFolders = await eagle.folder.getSelected();
    if (currentFolders.length != 1){
        return null;
    }
    return currentFolders[0];
}

async function folderGetParent(folder){
    const allFolders = await eagle.folder.getRecents();

    for (const folder2 of allFolders){
        if (folder2.id == folder.id){
            continue;
        }

        // if folder.id in fo   lder2.children
        if (folder2.children.length > 0){
            for(const folder3 of folder2.children){
                if (folder3.id == folder.id){
                    return folder2;
                }
            }
        }
    }
}

async function folderHasParent(folder){
    const parent = await folderGetParent(folder);
    return parent != null;
}


async function getChildFolder(folder, name){
    for (const folder2 of Object.values(folder.children)){
        if (folder2.name == name){
            return folder2;
        }
    }
    return null;
}