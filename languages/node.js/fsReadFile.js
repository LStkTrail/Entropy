const fs = require('fs');

console.log('1. 准备开始读取文件...');

fs.readFile('./message.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取出错：', err);
    return;
  }

  console.log('读取成功，内容是：');
  console.log(data);
});

console.log('2. 这里的代码会先执行，因为读取是异步的！');