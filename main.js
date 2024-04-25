const robot = require('robotjs');
const jimp = require('jimp');
const path = require('path')

const recorder = {
    outputPath: './output/',
    timeStartRecord: null,
    recording: false,
    times: 0,
    interval: 1000,

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
        }
    },

    capture(savepath) {
        // 获取屏幕宽度和高度
        const screenSize = robot.getScreenSize();
        const screenWidth = screenSize.width;
        const screenHeight = screenSize.height;

        // 捕获屏幕图像
        const imageData = robot.screen.capture();

        // 使用jimp处理和保存图像到文件
        var image = new jimp(imageData.width, imageData.height, function(err, img) {
          img.bitmap.data = imageData.image;
          img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
            var red   = img.bitmap.data[ idx + 0 ];
            var blue  = img.bitmap.data[ idx + 2 ];
            img.bitmap.data[ idx + 0 ] = blue;
            img.bitmap.data[ idx + 2 ] = red;
          });
          img.write(savepath);
        });
    }
}

let lastMouse;
function check() {
    const mouse = robot.getMousePos();
    if (lastMouse && (lastMouse.x !== mouse.x || lastMouse.y !== mouse.y)) {
        console.log('mouse moved, capturing...');
        recorder.record();
    }
    lastMouse = mouse;

    setTimeout(check, 200);
}

console.log('Recorder launched.');
check();