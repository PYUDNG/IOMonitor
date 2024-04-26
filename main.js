'use strict';

const VERBOSE = true;

const robot = require('robotjs');
const jimp = require('jimp');
const path = require('path');
const colorDiff = require('color-diff');

const recorder = {
    outputPath: `./output/${Date.now()}`,
    timeStartRecord: null,
    recording: false,
    times: 0,
    interval: 1000,
    lastCapture: null,

    /**
     * record screen N times with an interval of T
     * 
     * @param {number} [times=5] - N
     * @param {number} [interval=1000] - T
     */
    record(times=5, interval=1000) {
        this.times = times;
        this.interval = interval;
        if (!this.recording) {
            this.recording = true;
            this.timeStartRecord = Date.now();
            this.doRecord();
        }
    },

    doRecord() {
        const savepath = path.join(
            this.outputPath,
            this.timeStartRecord.toString(),
            `${ Date.now() }.png`
        );
        this.capture(savepath);

        if (--this.times > 0) {
            const that = this;
            setTimeout(function() { that.doRecord(); }, this.interval);
        } else {
            this.recording = false;
            this.times = 0;
            this.interval = 1000;
            this.timeStartRecord = null;
            this.lastCapture = null;
        }
    },

    /**
     * Capture screen and save to file
     * 
     * @param {string} savepath - saved file's path, with filename and extension
     * @param {boolean} [force=false] - whether to capture when current screen is the same as last capture's
     * @returns {boolean} whether actually took a capture. For param force==true, this is always true.
     */
    capture(savepath, force=false) {
        const runid = Math.random();

        // 获取屏幕宽度和高度
        const screenSize = robot.getScreenSize();
        const screenWidth = screenSize.width;
        const screenHeight = screenSize.height;

        // 捕获屏幕图像
        const bitmap = robot.screen.capture();

        // 历史数据
        if (this.lastCapture && this.isSameImage(bitmap, this.lastCapture) && !force) {
            return false;
        }
        this.lastCapture = bitmap;

        // 使用jimp处理和保存图像到文件
        this.saveImage(savepath, bitmap);

        return true;
    },

    saveImage(savepath, bitmap) {
        var image = new jimp(bitmap.width, bitmap.height, function(err, img) {
            img.bitmap.data = Buffer.from(Array.from(bitmap.image));
            img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
                var red   = img.bitmap.data[ idx + 0 ];
                var blue  = img.bitmap.data[ idx + 2 ];
                img.bitmap.data[ idx + 0 ] = blue;
                img.bitmap.data[ idx + 2 ] = red;
            });
            img.write(savepath);
        });
    },

    /**
     * Determine whether two images are the same
     * Accepts bitmap object returned by RobotJS.screen.capture
     *
     * @param {bitmap} bitmap1 - first image
     * @param {bitmap} bitmap2 - second image
     * @param {number} [threshold_image=20] - max amout of different pixels allowed between two same images. Or, if <=1, be the max rate of all pixels.
     * @param {number} [threshold_pixel=10] - max diff number allow between two same pixels
     * @returns {boolean}
     */
    isSameImage(bitmap1, bitmap2, threshold_image=0.01, threshold_pixel=10) {
        const [img1, img2] = [bitmap1.image, bitmap2.image];
        if (bitmap1.width !== bitmap2.width || bitmap1.height !== bitmap2.height) {
            return false;
        }

        let diffCount = 0;
        for (let i = 0; i < img1.length; i += 4) {
            const [pixel1, pixel2] = [img1.slice(i, i+4), img2.slice(i, i+4)];
            diffCount += +!isSamePixel(pixel1, pixel2, threshold_pixel);
        }

        threshold_image = threshold_image > 1 ? threshold_image
            : Math.round(threshold_image * bitmap1.width * bitmap1.height);
        return diffCount <= threshold_image;

        /**
         * @typedef RGBAobj
         * @type {object}
         * @property {number} R
         * @property {number} G
         * @property {number} B
         * @property {number} A
         */
        /**
         * @typedef pixel
         * @type {number[]}
         */
        /**
         * Convert pixel to RGB object
         * 
         * @param {pixel} pixel - array with 4 numbers as BGRA
         * @returns {RGBAobj}
         */
        function pixel2RGB(pixel) {
            return {
                R: pixel[2],
                G: pixel[1],
                B: pixel[0],
                A: pixel[3]
            }
        }

        /**
         * Determine whether two pixels are the same
         * 
         * @param {pixel} p1
         * @param {pixel} p2
         * @param {number} [threshold=10] - max diff number allow between two same pixels
         */
        function isSamePixel(p1, p2, threshold=10) {
            const diff = colorDiff.diff(pixel2RGB(p1), pixel2RGB(p2));
            return diff <= threshold;
        }
    }
}

let lastMouse;
function check() {
    const mouse = robot.getMousePos();
    if (lastMouse && (lastMouse.x !== mouse.x || lastMouse.y !== mouse.y)) {
        recorder.record();
    }
    lastMouse = mouse;

    setTimeout(check, 200);
}

console.log('Ready.');
check();