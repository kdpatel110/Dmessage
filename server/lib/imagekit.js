import ImageKit, { toFile } from "@imagekit/nodejs/index.js";
const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // This is the default and can be omitted
});

function hasImageKitConfig(){
    return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

// My Photo (1) .png
// "chat-1749300000000-My_Photo_1 _. png"
// this helper makes a safe, unique filename for uploaded files.
function createFileName(originalName = "upload") {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `chat-${Date.now()}-${safeName}`;
}

//either an image or an video
async function uploadChatMedia(file) {
    const fileName = createFileName(file.originalName);
    
    const result = await imagekit.files.upload({
        file: await toFile(file.buffer, fileName, {type: file.mimetype}),
        fileName,
        folder: "/chat",
    })
}

export {uploadChatMedia, hasImageKitConfig};