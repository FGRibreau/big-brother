/*function getFoursquare(){
		loadScript('https://api.foursquare.com/v2/checkins/recent?oauth_token=JCVENEJGYMCAYQ4AFULE0R4ORCNFI5AMTIKMR0TOS5E5ZD3Z&limit=90&callback=initialize');
}*/


function initialize(data) {
	var d = data.response.recent;
	//console.log(data);
	var Size = google.maps.Size
	,	Point = google.maps.Point;
	
	console.log(d[0].venue.location.lat, d[0].venue.location.lng);
	var myLatlng = new google.maps.LatLng(d[0].venue.location.lat, d[0].venue.location.lng);
	var myOptions = {
	zoom: 8,
	center: myLatlng,
	mapTypeId: google.maps.MapTypeId.ROADMAP
  	};
	
	var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	
	for(var i=0, iM = d.length; i < iM; i++) {
		console.log(d[i].venue.location.lat,d[i].venue.location.lng); 
		var marker = new google.maps.Marker({
				position: new google.maps.LatLng(d[i].venue.location.lat,d[i].venue.location.lng),
				map: map,
				icon: new google.maps.MarkerImage(d[i].user.photo
					,	new Size(110,110)
					,	new Point(0,0)
					,	new Point(0,0)
					,	new Size(32,32))
		    });
	}
}

function loadScript(url) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  document.body.appendChild(script);
}
