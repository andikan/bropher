define([
  'jquery',
  'underscore',
  'backbone',
  'socketio'
], function($, _, Backbone, Socketio) {
	var AppRouter = Backbone.Router.extend({
      routes: {
        // Define some URL routes
        '': 'home',

        'mapper': 'mapper',

        // Default
        '*actions': 'defaultAction'
      },

      initialize: function(){
        console.log('router initialize');
        if (window.location.hash == '#_=_')
          window.location.hash = '';

  //     	var socket = io.connect('http://localhost:5000');
  //     	socket.on('news', function (data) {
		//     console.log(data);
		//     socket.emit('event', { my: 'data' });
		// });
      },

      home: function(){
      	var main_socket = io.connect('http://localhost:5000/main');
      	main_socket.on('connect', function(){
      		console.log('send userinfo');
      		main_socket.emit('userinfo', { user_agent: navigator.userAgent });
      	});

      	main_socket.on('current_mappers', function(data){
      		console.log('current mappers: '+data.mappers);
      	});

      	main_socket.on('keyword_tasks', function(data){
      		console.log(JSON.stringify(data));
      	});	

      	$('#keyword_search').click(function(e){
			var keyword = $('input[name="keyword"]').val();
			if(keyword != ''){
				console.log('emit keyword: '+keyword);
				main_socket.emit('keyword_input', {keyword: keyword});
			}
      	});
      	

      },

      mapper: function(){
      	var mapper_socket = io.connect('http://localhost:5000/mapper');
      	mapper_socket.on('connect', function(){
      		console.log('establish mapper_socket');
      		mapper_socket.emit('userinfo', { user_agent: navigator.userAgent });
      	});
      },

      defaultAction: function(){
        // Backbone.history.navigate('', true);
      }
    });

    var initialize = function(){
    	var app_router = new AppRouter();
    	Backbone.history.start({pushState: true, root: '/'});
  	};

  	return {
      initialize: initialize
    };
});