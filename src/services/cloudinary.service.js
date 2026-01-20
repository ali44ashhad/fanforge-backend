const cloudinary = require('../config/cloudinary');
const { AppError } = require('../utils/helpers');

// Upload image to Cloudinary
const uploadImage = async (fileBuffer, folder = 'fanforge/products') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    reject(new AppError('Image upload failed', 500));
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
        // Don't throw error, just log it
    }
};

// Delete multiple images
const deleteImages = async (publicIds) => {
    try {
        await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
        console.error('Cloudinary bulk deletion error:', error);
    }
};

module.exports = {
    uploadImage,
    deleteImage,
    deleteImages,
};
