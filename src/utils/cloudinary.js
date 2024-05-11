// yaha haam file upload hamare production team ke local server pa aane ke baaad ka code likhne wale hai

import {v2 as cloudinary} from cloudinary;

import fs from fs;

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary", response.url)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  // remocve the temporarcy saved file if upload operation fails
        return null;
    }
}


// const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", {
//         public_id: "shoes"
//     }).catch((error)=>{console.log(error)});

export {uploadOnCloudinary}