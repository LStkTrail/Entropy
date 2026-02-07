fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => {
    console.log(response); 

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('是否成功:', response.ok);
    console.log('头部信息:', response.headers.get('Content-Type'));

    console.log('数据流:', response.body); 
    
    return response.json();
  })
  .then(data => {
    console.log(data);
  });
  