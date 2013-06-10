module.exports = function(app, io) {
	// include
	var _ = require('underscore'),
		util = require('util'),
		child_process = require('child_process');

	// routes
	var main = require('../controllers/main'),
		twitter = require('../controllers/twitter');

	// sockets
	var main_socket = io.of('/main'),
		mapper_socket = io.of('/mapper');

	// task_manager
	var main_socket_clients = [],
		keyword_tasks = [],
		mapper_socket_clients = [];

	console.log('init main_sockets_client : '+main_socket_clients.length);

	// send to one client 
	// main_socket.sockets.socket(id).emit();


	// main console socket
	main_socket.on('connection', function(socket) {

		socket.on('disconnect', function(){
			_.each(_.range(0, main_socket_clients.length), function(i){
				if(main_socket_clients[i].socket_id == socket.id){
					main_socket_clients.splice(i, 1);
				}
			});
			console.log('client disconnect');
			console.log('connection num: '+main_socket_clients.length);
		});

		socket.on('userinfo', function(data){
			console.log(data);
			console.log('socket id: '+ socket.id);
			var client_info = {
				socket_id: socket.id,
				user_agent: data.user_agent
			}
			main_socket_clients.push(client_info);
			console.log('connection num: '+main_socket_clients.length);
		});

		socket.on('keyword_input', function(data){
			console.log('receive keyword: '+data.keyword);
			
			// fork a child process
			var twitter_search_worker = child_process.fork('./workers/twitter_search');
			twitter_search_worker.send({keyword: data.keyword});

			keyword_tasks.push({
				keyword: data.keyword, 
				pid: twitter_search_worker.pid,
				status: 'init'
			});

			twitter_search_worker.on('message', function(m) {
			  console.log('PARENT got message:', m.msg);
			  if(m.msg == 'progress'){
			  	_.each(keyword_tasks, function(task){
			  		if(task.keyword == m.keyword && task.pid == twitter_search_worker.pid){
			  			task.tweet_count = m.tweet_count,
			  			task.max_id = m.max_id,
			  			task.status = 'progress'
			  		}
			  	});
			  	socket.emit('keyword_tasks', keyword_tasks);
			  }
			  if(m.msg == 'exit'){
			  	_.each(keyword_tasks, function(task){
			  		if(task.keyword == m.keyword && task.pid == twitter_search_worker.pid){
			  			task.tweet_count = m.tweet_count,
			  			task.max_id = m.max_id,
			  			task.status = 'wait_mapper'
			  		}
			  	});
			  	socket.emit('keyword_tasks', keyword_tasks);
			  }
			});
		});
	});


	// mapper socket
	mapper_socket.on('connection', function(socket){

		socket.on('userinfo', function(data){
			console.log('socket id: '+ socket.id);
			var client_info = {
				socket_id: socket.id,
				user_agent: data.user_agent
			}
			mapper_socket_clients.push(client_info);
			console.log('mapper num: '+mapper_socket_clients.length);

			main_socket.emit('current_mappers', {mappers: mapper_socket_clients});
		});

		socket.on('disconnect', function(){
			_.each(_.range(0, mapper_socket_clients.length), function(i){
				if(mapper_socket_clients[i].socket_id == socket.id){
					mapper_socket_clients.splice(i, 1);
				}
			});
			console.log('mapper disconnect');
			console.log('mapper num: '+mapper_socket_clients.length);

			main_socket.emit('current_mappers', {mappers: mapper_socket_clients});
		});

	});



	// io.sockets.on('connection', function (socket) {
	//   socket.emit('news', { hello: 'world' });
	//   socket.on('event', function (data) {
	//     console.log(data);
	//   });
	// });

	// routes
	app.get('/', main.index);
	app.get('/mapper', main.mapper);
	app.get('/search/:keyword', twitter.search);

};