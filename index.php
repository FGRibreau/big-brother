<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
	"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
	<title>Big brother</title>

	<style type="text/css" media="screen">
		*{margin:0;padding:0;}
		
		a, a:visited{
			color:#2276BB;
			text-decoration:none;
		}
		
		a:hover{
			text-decoration:underline;
		}
		
		
		input {padding:5px;width:95%;margin:5px auto 5px auto;}
		
		.params {-webkit-border-radius:0 0px 10px 10px; z-index:100; background-color:#FFFFFF;position:absolute;left:60px;top:0px;width:300px;max-height:300px;padding:5px;overflow:auto}
		
		
		a.delete {color:red;}
		
		#res.loading{
			height:100px;
			background:url('./ajax-loader.gif') no-repeat 50% 50%;
		}
	</style>
	<link rel="stylesheet" type="text/css" href="css/jquery.gritter.css" />
</head>

<body>
<div class="params" >
	<a href="#" id="closeFen" style="float:right">Toggle</a>
	<div id="panelFen">
		<p>
		<label for="">Ajouter des points à surveiller (<a href="#" id="listPoint">liste</a>)</label>
		<input type="text" name="" value="" id="concurrentSearch" placeholder="Emplacement, endroit.."/>
		</p>
		<div id="res">
		</div>
	</div>
</div>
<div id="map_canvas" style="width:100%; height:100%">
	
</div>

<script type="text/javascript" charset="utf-8" src="jquery.js"></script>
<script type="text/javascript" charset="utf-8" src="foursquare.js"></script>
<script type="text/javascript" src="js/jquery.gritter.min.js"></script>

<script type="text/javascript" charset="utf-8">

var map = false;

// window.localStorage.setItem('pointToSurvey','{}')
// window.localStorage.getItem('pointToSurvey')
if(!location.hash){
	location.href = 'https://foursquare.com/oauth2/authenticate?client_id=1RRQ0VUPXTOSU50DF5XYFLO0KOJUHVIFQBIIHUFGWPOSKNIZ&response_type=token&redirect_uri=http%3A%2F%2Fhackathon.local';
	return;
}
var token = location.hash.substr(location.hash.indexOf('=')+1);

function initialize() {
  var myLatlng = new google.maps.LatLng(47.220974470267166, -1.562579870223999);
  var myOptions = {
    zoom: 8,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
}
  
function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=initialize";
  document.body.appendChild(script);
}
  
window.onload = loadScript;

function RequestPermission (callback) {
        window.webkitNotifications.requestPermission(callback);
}

function showNotification(img, title, text){
if (window.webkitNotifications.checkPermission() > 0) {
	RequestPermission(showNotification);
}
else {
  window.webkitNotifications.createNotification(img, title, text).show(); 
}
}

var initied = false;

var pointToSurvey = {};
if(window.localStorage.getItem('pointToSurvey')){
	try{
	pointToSurvey = JSON.parse(window.localStorage.getItem('pointToSurvey'));
	}catch(e){}
}

function saveData(){
	window.localStorage.setItem('pointToSurvey', JSON.stringify(pointToSurvey));
}
	$(function(){	
	
		var c = document.getElementById("map_canvas");
		c.style.height = window.innerHeight+"px";
		c.style.width = window.innerWidth+"px";
		$.getScript('http://maps.google.com/maps/api/js?sensor=false');

	
		function addToSurveyPoint(e){
			e.preventDefault();
			var $e = $(e.target);
			
			if($e.hasClass('delete')){
				console.log('suppression');
				delete pointToSurvey[$e.prop('rel')];

			} else {
				pointToSurvey[$e.prop('rel')] = {'_data':$e.text(), '_loc':{lat:$e.data('lat'), lng:$e.data('lng')}};
				$e.hide(100);
			}
			
			saveData();
		}
	
		// Recherche
		$s = $('#concurrentSearch');
		
		$('#listPoint').click(function(e){
			e.preventDefault();
			
			var out = '';
			Object.keys(pointToSurvey).forEach(function(id){
				out += '- ' + pointToSurvey[id]._data+'\n';
			});
			
			alert(out);
		});
		
		$('#closeFen').click(function(e){
			e.preventDefault();
			$('#res').html('');
			$('#panelFen').toggle(100);
		});
		
		
		$s.bind('change', function(){
			$('#res').html('');
			$('#res').addClass('loading');
				$.getJSON('https://api.foursquare.com/v2/venues/search?limit=50&query='+encodeURIComponent($s.val())+'&ll=47.220974470267166,-1.562579870223999&oauth_token='+token+'&callback=?', function(data){
				
				$('#res').removeClass('loading');
				
				if(data.meta.code !== 200){
					return alert('Aucun résultat');
				}
			
				var res = '';
				data.response.groups.forEach(function(group){
					res += '<ul>';
				
					res += '<li><h3>'+group.name+'</h3></li>';
				
					group.items.forEach(function(item){
						res += '<li>';
						
						if(!pointToSurvey[item.id]){
							res += '<a href="#" rel="'+item.id+'" data-lat="'+item.location.lat+'" data-lng="'+item.location.lng+'">';
						}
						
						res += item.name;
						
						if(!pointToSurvey[item.id]){
							res += '</a>';
						}
						
						if(pointToSurvey[item.id]){
							res += ' <a href="#" class="delete" rel="'+item.id+'">X</a>';
						}
						
						res += '</li>';
					});
				
					res += '</ul>';
				});
			
				$('#res').html(res);
				
			});
		});
	
		$('#res').click(addToSurveyPoint);
	
	});
	
	// Checker les points
	function checkNextPoint(){
	
		Object.keys(pointToSurvey).forEach(function(id){
			$.getJSON('https://api.foursquare.com/v2/venues/'+id+'/herenow?oauth_token='+token+'&callback=?', function(data){
				onCheckedPoint(data, id);
			});
		});
	}
	
	function onCheckedPoint(data, idVenues){
		if(data.response.hereNow.count == 0){
			return;
		}
		
		data.response.hereNow.items.forEach(function(item){
			
			// L'user vient d'arriver
			if(!pointToSurvey[idVenues][item.user.id]){
				
				// Vérifier s'il cet user n'est pas déjà dans la BDD
				
				pointToSurvey[idVenues][item.user.id] = item.user;
				saveData();
				var text = item.user.firstName + ' ' + item.user.lastName + ' vient de checker à ' + pointToSurvey[idVenues]._data;

				(function(notif){
					notif.show();
					window.setTimeout(function(){
						notif.cancel()
					}, 5000);
				})(	window.webkitNotifications.createNotification(item.user.photo,
					      pointToSurvey[idVenues]._data, text));
				
				
				if(map){
					var pos = new google.maps.LatLng(pointToSurvey[idVenues]._loc.lat, pointToSurvey[idVenues]._loc.lng);
					var marker = new google.maps.Marker({
							position: pos,
							map: map,
							icon: new google.maps.MarkerImage(item.user.photo
								,	new google.maps.Size(110,110)
								,	new google.maps.Point(0,0)
								,	new google.maps.Point(0,0)
								,	new google.maps.Size(32,32))
					    });
					
					map.setCenter(pos, 16);
					map.setZoom(16);
				}

				//console.log(text);
			}
		});
		
	}
	
	setTimeout(function(){
		checkNextPoint();

		setInterval(checkNextPoint, 1000*60);// Toutes les minutes
	}, 5000);
</script>
</body>
</html>
