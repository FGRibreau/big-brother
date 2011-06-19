// Hackathon Web2Day 2011
// Big Brother is watching you
// Fork it @ https://github.com/FGRibreau/big-brother

// Reset data with window.localStorage.setItem('places','{}')

// TODO: check all @TODOs below :)


// @TODO: group $ var
function BigBrother($map, $input, $results, $list, $toggle, foursquare){
	this.$map = $map || $('<div/>');
	this.map = null;
	
	this.$input = $input || $('<input />');
	this.$results = $results || $('<div/>');
	this.$list = $list || $('<a/>');
	this.$toggle = $toggle || $('<a/>');
	
	this.$body = $(document.body);
	
	this.places = {};

	this.foursquare = {
		clientId:'[CLIENTID]',
		redirectUri:location.origin+location.pathname,
		token:location.hash.substr(location.hash.indexOf('=')+1)
	};
	
	$.extend(this.foursquare, foursquare);
	
	this.REFRESH_DELAY = 60*1000;
	
	// Let's rock !
	this.checkCompatibility();
	
	// Foursquare
	this.fq_authentify();
	
	// LocalStorage
	this.placesLoad();
	
	// Google Map
	this.gmap_resize();
	this.gmap_load();

  // UI
	this.bindAll();
	
	// FIXME: This is ugly
	setTimeout(this.startMonitor.bind(this), 5*1000);
}


BigBrother.prototype = {
// Compatibility
	isCompatible: function(){
		return 'webkitNotifications' in window 
		&& 'localStorage' in window 
		&& 'forEach' in Array.prototype
		&& 'bind' in Function.prototype;
	}
	
,	checkCompatibility: function(){
		if(this.isCompatible())
			return;
	
		var msg = 'You must use Chrome 12+ in order to get HTML5 Notification working\n';
		$('body').html($('<h1/>').html(msg.replace('\n','<br/>')));
		throw new Error("This browser is not compatible");
}

// Foursquare
,	fq_authentify: function(){
		if(location.hash && this.foursquare.token){
			return;
		}
	
		location.href = 'https://foursquare.com/oauth2/authenticate?client_id='
			+this.foursquare.clientId+'&response_type=token&redirect_uri='
			+encodeURIComponent(this.foursquare.redirectUri);
}

,	fq_searchVenues: function(venueName, callback){
		$.getJSON('https://api.foursquare.com/v2/venues/search?limit=50&query='
		+encodeURIComponent(venueName)+'&ll=47.220974470267166,-1.562579870223999&oauth_token='
		+this.foursquare.token+'&callback=?', callback.bind(this));
}

,	fq_whoseHereNow: function(venueId, callbackForEachItem){
	
		var _cb = callbackForEachItem.bind(this);
	
		$.getJSON('https://api.foursquare.com/v2/venues/'
		+venueId+'/herenow?oauth_token='
		+this.foursquare.token+'&callback=?', function(data){
			if(!data.response || !data.response.hereNow.items || (data.response 
			&& data.response.hereNow
			&& data.response.hereNow.count == 0)){
				return;
			}
			
			data.response.hereNow.items.forEach(function(item){
				_cb(item, venueId);
			});
		});
}


// Big brother logic
,	resfreshCheckIn: function(onComplete){
		Object.keys(this.places).forEach(function(idVenue){
			this.fq_whoseHereNow(idVenue, this.onCheckIn);
		}.bind(this));
}


,	onCheckIn: function(item, venueId){
		if(this.places[venueId][item.user.id]){
			// We already notified for this item.user
			return;
		}
		
		// The item.user has just checked-in @ venueId
		var u = item.user
		,	userName = (u.firstName ? u.firstName : '') + ' ' + (u.lastName ? u.lastName : '');
		
		// Add it
		this.placesAddUser(venueId, u.id, u);
		
		// Notify the user
		this.notification(item.user.photo
			, this.places[venueId].name
			, (userName == ' ' ? 'Anonymous' : userName) + ' vient de checker à ' + this.places[venueId].name);
			
		// Update the map
		this.gmap_addMarker(this.places[venueId].loc, u.photo);
}

,	startMonitor: function(){
		this.resfreshCheckIn();
		setInterval(this.resfreshCheckIn.bind(this), this.REFRESH_DELAY);
}

// Gmap
,	gmap_load: function(){
		this.map = new google.maps.Map(this.$map[0], {
		  zoom: 8,
		  center: new google.maps.LatLng(47.220974470267166, -1.562579870223999),
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		});
}

,	gmap_resize: function(){
		if(!this.$map){
		  return;
		}
		
		this.$map.css({
			height:this.$body.innerHeight()+'px'
		,	width:this.$body.innerWidth()+'px'
		});
}

,	gmap_addMarker: function(latlng, img){
		var pos = new google.maps.LatLng(latlng.lat, latlng.lng);
		new google.maps.Marker({
			position: pos,
			map: this.map,
			icon: new google.maps.MarkerImage(img
				,	new google.maps.Size(110,110)
				,	new google.maps.Point(0,0)
				,	new google.maps.Point(0,0)
				,	new google.maps.Size(32,32))
		 });
		
		this.map.setCenter(pos, 16);
		this.map.setZoom(16);
}


// HTML5 LocalStorage
,	placesSave: function(){
		try{
			localStorage.setItem('places', JSON.stringify(this.places));
		} catch(e){
			alert('An error occured while saving places' + e.message);
		}
}

,	placesLoad: function(){
		var db = localStorage.getItem('places');
		if(db){
			try{this.places = JSON.parse(localStorage.getItem('places'));}catch(e){}
		}
}

,	placesAdd: function(id, name, lat, lng){
		this.places[id] = {'name':name, 'loc':{lat:lat, lng:lng}};
		this.placesSave();
}

,	placesAddUser: function(id, userId, user){
		this.places[id][userId] = user;
		this.placesSave();
}

,	placesDelete: function(id){
		delete this.places[id];
		this.placesSave();
}

// HTML5 Notification API
,	notification: function(img, title, text){
	window.webkitNotifications.requestPermission();
	
	(function(notification){
		notification.show();
		
		// (Hack) Hide after 5s
		window.setTimeout(function(){
			notification.cancel()
		}, 5000);
	})(window.webkitNotifications.createNotification(img, title, text));
}


// UI
	// Events
,	bindAll:function(){
		

		this.$input.change($.proxy(this.onInputChange, this));
		this.$list.click($.proxy(this.showList, this));
		this.$toggle.click($.proxy(this.onToggle, this));
		this.$results.click($.proxy(this.onResultsClick, this));
		
		// Todo: Bind "gmap_resize" onResize (with $.throttle)
		$(window).resize($.proxy(this.gmap_resize, this));
}
	
,	onInputChange: function(){
		this.$results.empty().addClass('loading');
		this.fq_searchVenues(this.$input.val(), $.proxy(this.onVenuesData, this));
}

,	onResultsClick: function(e){
	e.preventDefault();
	var $e = $(e.target);
	
	if($e.hasClass('delete')){
		this.placesDelete($e.prop('rel'));
	} else {
		this.placesAdd($e.prop('rel'), unescape($e.data('name')), $e.data('lat'), $e.data('lng'));
	}
	
	$e.hide(100);
}

,	onVenuesData: function(data){
		this.$results.removeClass('loading');
	
		if(data.meta.code !== 200 || data.response.groups.length == 0){
			return alert('Nothing found');
		}

		// TODO: Ugly & slow (recursivity), change this later !!!!! Shame on you !
		this.$results.html(this._forEachBuffered(data.response.groups, this._renderGroup));
}

,	onToggle: function(e){
		e.preventDefault();
		this.$results.empty();
		this.$toggle.siblings('.panel').toggle(100);
}
	
// "View"
	// Helper
,	showList: function(e){
		e.preventDefault();

		var out = '';
		Object.keys(this.places).forEach($.proxy(function(id){
			out += "- " + this.places[id].name+'\n';
		}, this));

		if(!out){
			out += 'No place monitored';
		}

		alert(out);
}

,	_forEachBuffered: function(data, fn){
		var html = ''
		,	_fn = $.proxy(fn, this);
		
		data.forEach(function(item){html += _fn(item)});
		return html;
}
	
	// TODO: Use a template b*tch, b*tch love templates.
,	_renderGroup: function(group){
		return '<ul><li><h3>'+group.name+'</h3></li>' + this._forEachBuffered(group.items, this._renderItem) + '</ul>';
}
	
	// TODO: Use a template b*tch, b*tch love templates.
,	_renderItem: function(item){
		var html = '<li>';

		if(!this.places[item.id]){
			html += '<a href="?" title="Monitor this place" rel="'+item.id+'" data-name="'+escape(item.name)+'" data-lat="'+item.location.lat+'" data-lng="'+item.location.lng+'">';
		}

		html += item.name;

		if(!this.places[item.id]){
			html += '</a>';
		} else {
			html += ' <a href="?" class="delete" rel="'+item.id+'">X</a>';
		}

		return html + '</li>';
}
};