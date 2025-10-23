/**
 * Image Processing Utilities for Product Images
 * Handles 4:5 aspect ratio (1080x1350px) with smart cropping and quality optimization
 */

class ProductImageProcessor {
    constructor() {
        // Target dimensions for Instagram vertical format
        this.TARGET_WIDTH = 1080;
        this.TARGET_HEIGHT = 1350;
        this.TARGET_RATIO = 4 / 5; // 0.8
        this.QUALITY = 0.92; // High quality JPEG
        this.MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        
        // Minimum quality thresholds
        this.MIN_WIDTH = 540; // Half of target
        this.MIN_HEIGHT = 675;
        this.TOLERANCE = 0.1; // 10% tolerance for aspect ratio
    }

    /**
     * Process an image file to meet quality standards
     * @param {File} file - Image file to process
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processed image data
     */
    async processImage(file, options = {}) {
        const {
            mode = 'cover', // 'cover', 'contain', 'smart'
            quality = this.QUALITY,
            format = 'image/jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const img = new Image();
                    
                    img.onload = async () => {
                        const analysis = this.analyzeImage(img);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = this.TARGET_WIDTH;
                        canvas.height = this.TARGET_HEIGHT;
                        
                        // Apply appropriate processing mode
                        if (mode === 'cover') {
                            this.applyCoverMode(ctx, img, canvas);
                        } else if (mode === 'contain') {
                            this.applyContainMode(ctx, img, canvas);
                        } else if (mode === 'smart') {
                            this.applySmartMode(ctx, img, canvas, analysis);
                        }
                        
                        // Convert to blob
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error('Failed to create image blob'));
                                return;
                            }
                            
                            const processedFile = new File([blob], file.name, {
                                type: format,
                                lastModified: Date.now()
                            });
                            
                            resolve({
                                file: processedFile,
                                preview: canvas.toDataURL(format, quality),
                                analysis: analysis,
                                originalSize: file.size,
                                processedSize: blob.size,
                                dimensions: {
                                    width: canvas.width,
                                    height: canvas.height
                                }
                            });
                        }, format, quality);
                    };
                    
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = e.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Analyze image quality and characteristics
     * @param {HTMLImageElement} img - Image to analyze
     * @returns {Object} Image analysis
     */
    analyzeImage(img) {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratio = width / height;
        const targetRatio = this.TARGET_RATIO;
        
        const isCorrectRatio = Math.abs(ratio - targetRatio) < this.TOLERANCE;
        const isHighQuality = width >= this.TARGET_WIDTH && height >= this.TARGET_HEIGHT;
        const needsUpscaling = width < this.TARGET_WIDTH || height < this.TARGET_HEIGHT;
        const needsCropping = !isCorrectRatio;
        
        let qualityLevel = 'hd';
        if (width < this.MIN_WIDTH || height < this.MIN_HEIGHT) {
            qualityLevel = 'low';
        } else if (width < this.TARGET_WIDTH || height < this.TARGET_HEIGHT) {
            qualityLevel = 'sd';
        }
        
        return {
            originalWidth: width,
            originalHeight: height,
            ratio: ratio,
            targetRatio: targetRatio,
            isCorrectRatio: isCorrectRatio,
            isHighQuality: isHighQuality,
            needsUpscaling: needsUpscaling,
            needsCropping: needsCropping,
            qualityLevel: qualityLevel,
            recommendation: this.getRecommendation(width, height, ratio)
        };
    }

    /**
     * Get recommendation for image
     */
    getRecommendation(width, height, ratio) {
        const targetRatio = this.TARGET_RATIO;
        
        if (width < this.MIN_WIDTH || height < this.MIN_HEIGHT) {
            return {
                level: 'error',
                message: `Изображение слишком маленькое (${width}x${height}). Минимум ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px`,
                action: 'reject'
            };
        }
        
        if (width < this.TARGET_WIDTH || height < this.TARGET_HEIGHT) {
            return {
                level: 'warning',
                message: `Изображение меньше рекомендуемого (${width}x${height}). Рекомендуем ${this.TARGET_WIDTH}x${this.TARGET_HEIGHT}px`,
                action: 'warn'
            };
        }
        
        if (Math.abs(ratio - targetRatio) > this.TOLERANCE) {
            return {
                level: 'info',
                message: `Изображение будет обрезано для соответствия формату 4:5`,
                action: 'crop'
            };
        }
        
        return {
            level: 'success',
            message: 'Изображение отличного качества!',
            action: 'accept'
        };
    }

    /**
     * Apply cover mode - fills entire canvas, crops excess
     */
    applyCoverMode(ctx, img, canvas) {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.naturalWidth;
        let sourceHeight = img.naturalHeight;
        
        if (imgRatio > canvasRatio) {
            // Image is wider, crop sides
            sourceWidth = img.naturalHeight * canvasRatio;
            sourceX = (img.naturalWidth - sourceWidth) / 2;
        } else {
            // Image is taller, crop top/bottom
            sourceHeight = img.naturalWidth / canvasRatio;
            sourceY = (img.naturalHeight - sourceHeight) / 2;
        }
        
        // Enable smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvas.width, canvas.height
        );
    }

    /**
     * Apply contain mode - shows entire image with letterboxing
     */
    applyContainMode(ctx, img, canvas) {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imgRatio > canvasRatio) {
            // Image is wider
            drawHeight = canvas.width / imgRatio;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            // Image is taller
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
        }
        
        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Enable smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    /**
     * Apply smart mode - intelligent cropping based on content
     * Uses center-weighted cropping for product images
     */
    applySmartMode(ctx, img, canvas, analysis) {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = this.TARGET_RATIO;
        
        // If aspect ratio is close, use cover mode
        if (Math.abs(imgRatio - targetRatio) < this.TOLERANCE) {
            this.applyCoverMode(ctx, img, canvas);
            return;
        }
        
        // For product images, prefer showing more of the top/center
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.naturalWidth;
        let sourceHeight = img.naturalHeight;
        
        if (imgRatio > targetRatio) {
            // Image is wider - crop sides equally
            sourceWidth = img.naturalHeight * targetRatio;
            sourceX = (img.naturalWidth - sourceWidth) / 2;
        } else {
            // Image is taller - crop bottom more than top (product focus)
            sourceHeight = img.naturalWidth / targetRatio;
            sourceY = (img.naturalHeight - sourceHeight) * 0.3; // 30% from top
        }
        
        // Enable smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvas.width, canvas.height
        );
    }

    /**
     * Process multiple images
     */
    async processMultipleImages(files, options = {}) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processImage(file, options);
                results.push({
                    success: true,
                    ...result
                });
            } catch (error) {
                results.push({
                    success: false,
                    file: file,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Validate image before upload
     */
    async validateImage(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Неподдерживаемый формат. Используйте JPEG, PNG или WebP'
            };
        }
        
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)}MB). Максимум 5MB`
            };
        }
        
        try {
            const result = await this.processImage(file, { mode: 'smart' });
            
            if (result.analysis.recommendation.action === 'reject') {
                return {
                    valid: false,
                    error: result.analysis.recommendation.message
                };
            }
            
            return {
                valid: true,
                warning: result.analysis.recommendation.action === 'warn' ? result.analysis.recommendation.message : null,
                analysis: result.analysis
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Ошибка обработки изображения: ' + error.message
            };
        }
    }
}

// Export as global
window.ProductImageProcessor = ProductImageProcessor;
