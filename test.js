const robot = require('robotjs');

bitmap = robot.screen.capture();
console.log(bitmap.image.slice(0, 4));
console.log(bitmap.colorAt(0, 0));
