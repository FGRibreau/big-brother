	function notification()
	{
		if(window.webkitNotifications) // If we have the Notification API
		{
			var nc = window.webkitNotifications; // Set the API to nc for easy access
			if(nc.checkPermission()) // 1 = Not Allowed, 2 = Denied, 0 = Allowed
			{
				nc.requestPermission(myNotification); // Request Permission with a callback to myNotification();
			} else { myNotification(); }
		}
	}
	function myNotification()
	{
		try
		{
			var nc = window.webkitNotifications;
			var notif = nc.createNotification(null,"Notification Title","Notification Body"); // Parameters: string URL_TO_IMAGE, string Title, string Body
			notif.show(); // Show Notification
		} catch(Err) {
			alert(Err.message); // Will output a security error if we don't have permission.
		}
	}