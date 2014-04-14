var PROTOCOL = "http";
var ADDRESS = "localhost:8080";



var _GET = "get";
var _PUT = "put";
var _POST = "post";
var _DELETE = "DELETE";

$(document).ready(function () {
    initPaths();
});
/**
 * Constructs the base URL address (target to send the request to)
 * @param protocol http or https
 * @param address host and port of the target server
 * @param service service name of the LAS2peer service to use
 * @returns {string}
 */
function buildURLBase(protocol, address) {
    return protocol + "://" + address;
}


var URL = "";

var authData;
/**
 * Sets the local login data that is sent to the server with each request
 * Checks if the login data is valid by sending a simple test request
 * @param name
 * @param pass
 */
function login(name, pass, service) {
    //alert(name+" "+pass);
    authData = B64.encode(name + ":" + pass);

    checkLogin(URL+"/"+service, function () {
        /*checkLogin(visURL,function(){
         //alert("ok");
         });*/
        alert("Successfully logged in!");
    });
}
/**
 * Sends a simple request to the server to test, if the login data provided is valid
 * @param url
 * @param callback
 */
function checkLogin(url, callback) {
    $.ajax({
        url: url,
        dataType: "text",
        type: _GET,
        crossDomain: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + authData);
        },
        complete: function (xhr, status) {
            if (xhr.status == 401) {
                alert("Not authorized for " + url);
            }
            else if (xhr.status == 200) {

                if (callback && typeof(callback) === "function") {
                    callback();
                }
            }
            else {
                alert("Internal error for " + url);
            }
        }
    });/*.done(function (data) {

            if (data )//Display Errors
            {
                alert(data);
            };
			});*/
}


/**
 * Sends a request to the server and invokes a callback method with the server response as a parameter
 * @param baseURL address of server and LAS2peer service
 * @param method HTTP method
 * @param URI URI request String
 * @param content HTTP body content, if POST request
 * @param callback method to invoke with the received response data
 */
function sendRequest( method, URI, content, callback) {
	//alert(encodeURI(URL + "/" + URI));
	//alert(content);
    $.ajax({
        url: encodeURI(URL + "/" + URI),
        dataType: "text",
        type: method.toUpperCase(),
        data: content,
        contentType: "text/plain; charset=UTF-8",
        crossDomain: true,
        headers: {"Authorization": "Basic " + authData},
        complete: function (xhr, status) {
            if (xhr.status == 401) {
                alert("Not authorized for " + url);
            }
            else if (xhr.status != 200) {
                alert(xhr.status + " : Internal error for " + encodeURI(URL + "/" + URI));
            }
        }

    }).done(function (data) {

            if (data && data.indexOf("Error") == 0)//Display Errors
            {
                alert(data);
            }
            if (callback && typeof(callback) === "function") {
                callback(data);
            }
        });
}

var contentAreaCounter = 0;
/**
 * Registers events for the elements of the user interface
 */
function registerEvents() {
    $('#requests').focus();

    $('#addContentButton').click(function () {//create a new content text box
        contentAreaCounter++;
        var e = $(document.createElement('div'));
        e.addClass("modelItem collection");
        e.html("<div>Content " + contentAreaCounter + "</div> <textarea name='Text1' cols='100' rows='10' class='contentText'></textarea>");
        $('#contents').append(e);

    });


    $('#sendButton').click(function () { //send all typed in requests


        var contents = [];
        var requests = [];
        requests = $('#requests').val().split('\n');

        var selector = $('#contents .contentText');
        selector.each(function (index) {
            var elem = $(this);
            contents.push(elem.val());
        });
        sendRequests(requests, contents);
    });
}

/**
 * Sends all typed in requests synchronously to the Model Service
 * @param requests array of request strings
 * @param contents array of Strings to send as HTTP bodies
 */
function sendRequests(requests, contents) {

    (function () {
        var index = 0;
        var postCounter = 0;

        function sendNewRequest() {
            if (index < requests.length) {

                var request = requests[index].trim();
                var firstSpace = request.indexOf(" ");
                var method = request.substr(0, firstSpace).trim().toLowerCase();
                var URI = "";
				if(firstSpace>0)
				{
					URI=request.substr(firstSpace).trim();
				}
				

                var content = "";
                if (method == 'post') {
                    content = contents[postCounter++];
                }
                sendRequest(method, URI, content, function (data) {
                    var out;
                    out = "\nRequest\n" + method + " " + URI + "\n" + data + "\n" + "  ______________________________________  ";
                    console.log(out);


                    $('#output').val($('#output').val() + out);
                    var psconsole = $('#output');
                    psconsole.scrollTop(
                        psconsole[0].scrollHeight - psconsole.height()
                    );

                    ++index;
                    sendNewRequest();
                });
            }
        }

        sendNewRequest();

    })();


}
/**
 * Read config file and use protocol, host, port and service names defined in there
 */
function initPaths(){

    $('#config').load("pathConfig.xml", "", function () {
        var address = $('#config').find('address')[0];
        var protocol = $('#config').find('protocol')[0];
      
        ADDRESS = $(address).attr('value');       
        PROTOCOL = $(protocol).attr('value');
        init();
		

    });
}
/**
 * prepare login, register events
 */
function init() {

    URL = buildURLBase(PROTOCOL,ADDRESS);
    $('#loginName').val('User A');
    $('#loginPassword').val('userAPass');
    $('#loginButton').click(function () {
        login($('#loginName').val(), $('#loginPassword').val(),$('#loginService').val())
    });
	authData = /*B64.encode*/($('#loginName').val() + ":" + $('#loginPassword').val());
    registerEvents();
}