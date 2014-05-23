var tabContents = {};
var currentTab = 0;

var _GET = "get";
var _PUT = "put";
var _POST = "post";
var _DELETE = "delete";
var TEXT_PLAIN = 0;

$(document).ready(function () {
    init();
});

function init() {
    initEvents();
    initTabs();
    initFocus();
    loadState();
    initPlaceholder();
    initTooltips();
}
function initTooltips() {
    $("#tabs").attr("title", "Add content-tabs for PUT/POST requests. \nReference them in the request directly afer the URI using their number.\nThe content of the respective tab is then attached as the body to the http request.");
    $(".minMaxButton").attr("title", "Collapses/expands the panel beneath it.");

    $("#requestArea").attr("title", "For multiple requests use different lines.\nSyntax: HTTP-Method URI content-tab-number [header:value,header2:value2...].\nContent numbers and headers are optional: get food/pizza");
    $("#MIMESelector").attr("title", "Display response as text or try to interpret it based on the MIME-type.");
    $("#increaseDisplay").attr("title", "Increases the area for the result and decreases the area for the log.");
    $("#decreaseDisplay").attr("title", "Decreases the area for the result and increases the area for the log.");
}
function initPlaceholder() {
    var placeholder = "post students/albert/grades/physics 1 [content-type:text/xml,accept:text/plain]";
    $("#requestArea").attr("placeholder", placeholder);
    $("#requestArea").on("focus", function (e) { $("#requestArea").attr("placeholder", "");});
}
function sendRequest(method, URI, content, customHeaders, callback, errorCallback) {
    var requestURI = encodeURI(getBaseURI() + "/" + URI);
    var ajaxObj = {
        url: requestURI,

        type: method.toUpperCase(),
        data: content,
        contentType: "text/plain; charset=UTF-8",
        crossDomain: true,
        headers: { "Authorization": "Basic " + getBasicAuthLogin() },

        error: function (xhr, errorType, error) {
            var errorText = error;
            if (xhr.responseText != null && xhr.responseText.trim().length > 0)
                errorText = xhr.responseText;
            outputError(xhr.status, method, requestURI, errorText);
            errorCallback();
        },
        success: function (data, status, xhr) {
           
            var type = xhr.getResponseHeader("content-type");
            logRequest(method, requestURI, data);
            callback(data, type);
        },
    };
   
    if (customHeaders !== undefined && customHeaders !== null) {
        $.extend(ajaxObj.headers, customHeaders);
    }
    
    $.ajax(ajaxObj);
}

function parseRequests(input, contents) {
    var lines = input.split("\n");
    var filtered = lines.filter(function (e) { return e.trim().length > 0; });

    sendRequests(filtered, contents);
}

function parseRequest(request) {
    var requestData = {};
    request = request.trim();
    if (request.length == 0)
        return null;

    var parts = request.split(" ");
    var filtered = parts.filter(function (e) { return e.trim().length > 0; });

    if (filtered.length < 1)
        return null;

    requestData.method = filtered[0].trim().toLowerCase();

    if (filtered.length < 2)
        requestData.uri = "";
    else
        requestData.uri = filtered[1].trim();

    requestData.isSending = (requestData.method == _POST || requestData.method == _PUT);

    if (requestData.isSending) {
        if (filtered.length < 3) {
            requestData.isSending = false;
        } else {
            requestData.content = filtered[2].trim();
        }
    }
    //headers
    if (filtered[filtered.length - 1].indexOf("[") == 0) {
        requestData.headers = {};
        var headersString = filtered[filtered.length - 1];
        headersString = headersString.substring(1, headersString.length - 1);
        var headersStringSplit = headersString.split(",");
        for (var i = 0; i < headersStringSplit.length; i++) {
            var split = headersStringSplit[i].split(":");
            if (split.length != 2)
                return null;
            requestData.headers[split[0].trim()] = split[1].trim();
        }
    }

    return requestData;
}
function sendRequests(requests, contents) {
    (function () {
        var index = 0;
        var postCounter = 0;

        function sendNewRequest() {
            if (index < requests.length) {
                var requestData = parseRequest(requests[index]);
                if (requestData == null) {
                    outputParseError("Invalid request: " + requests[index]);
                    return;
                }

                var content = "";
                if (requestData.isSending) {
                    if (requestData.content in contents) {
                        content = contents[requestData.content];
                    }
                    else {
                        outputParseError("Invalid content number: " + requests[index]);
                        return;
                    }
                }

                sendRequest(requestData.method, requestData.uri, content, requestData.headers, function (data, type) {
                    outputResponse(data, type);
                    ++index;
                    sendNewRequest();
                }, function () {
                    ++index;
                    sendNewRequest();
                });
            }
        }

        sendNewRequest();
    })();
}
function isBase64(text) {
    var base64Matcher = new RegExp("^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");
    return base64Matcher.test(text.trim());
}
function outputResponse(data, type) {
    $("#contentDisplay").html("");

    var text = data;
    var sel = document.getElementById("MIMESelector");

    if (sel.selectedIndex == TEXT_PLAIN) {
        var textNode = document.createTextNode(text);
        $("#contentDisplay").append(textNode);
    }
    else {
        type = type.trim().toLowerCase();

        if (type.indexOf("image") == 0) {
            if (!isBase64(data))
                data = B64.encode(data);

            var outputImg = document.createElement('img');

            outputImg.src = 'data:' + type + ';base64,' + data;
            $("#contentDisplay").append(outputImg);
        }
        else
            $("#contentDisplay").html(text);
    }
}
function logRequest(method, uri, data) {
    var logEntry = method.toUpperCase() + " " + uri + "\n" + data;
    log(logEntry, false);
}
function outputError(status, method, uri, error) {
    var logEntry = status + " " + error + "\n" + method.toUpperCase() + " " + uri + "\n";
    log(logEntry, true);
}
function outputParseError(line) {
    log(line, true);
}
function numberPadding2(num) {
    return ("0" + num).slice(-2);
}
function log(entry, isError) {
    var date = new Date();

    var now = numberPadding2(date.getHours()) + ":" + numberPadding2(date.getMinutes()) + ":" + numberPadding2(date.getSeconds());
    var logEntry = "<b>" + now + "</b>" + " ";

    if (isError) {
        logEntry = "<span style='color:#A00;'>" + logEntry + "</span>";
    }
    var textNode = document.createTextNode(entry.replace(/\n/g, '\n         ') + "\n");
    $("#log").append(logEntry);
    $("#log").append(textNode);
    //$('#log').html($('#log').html() + logEntry);

    var logConsole = $('#log');

    logConsole.scrollTop(
        logConsole[0].scrollHeight - logConsole.height()
    );
}
function getBaseURI() {
    return $("#serverAddress").val() + ($("#uriPrefix").val().trim().length > 0 ? ("/" + $("#uriPrefix").val().trim()) : "");
}
function getBasicAuthLogin() {
    return B64.encode($("#userName").val() + ":" + $("#userPassword").val());
}
function initFocus() {
    $("#userPassword").focus();
}

function saveState() {
    localStorage["serverAddress"] = $("#serverAddress").val();
    localStorage["uriPrefix"] = $("#uriPrefix").val();
    localStorage["userName"] = $("#userName").val();
    localStorage["displayFlex"] = $('#contentDisplay').css("flex-grow");
   // localStorage["userPassword"] = $("#userPassword").val();
    var sel = document.getElementById("MIMESelector");
    localStorage["MIMESelector"] = sel.selectedIndex;
}

function loadState() {
    if (localStorage["serverAddress"] !== undefined)
        $("#serverAddress").val(localStorage["serverAddress"]);
    else
        $("#serverAddress").focus();

    if (localStorage["uriPrefix"] !== undefined)
        $("#uriPrefix").val(localStorage["uriPrefix"]);
    if (localStorage["userName"] !== undefined)
        $("#userName").val(localStorage["userName"]);

    if (localStorage["userPassword"] !== undefined)
        $("#userPassword").val(localStorage["userPassword"]);

    if (localStorage["displayFlex"] !== undefined)
        updateDisplaySize(parseFloat(localStorage["displayFlex"]));

    var sel = document.getElementById("MIMESelector");
    if (localStorage["MIMESelector"] !== undefined)
        sel.selectedIndex = localStorage["MIMESelector"];
}

function initTabs() {
    var tabs = $("#tabs");
    var requestButton = "<input id='contentTab0' type='button' value='Requests' />"
    var plusButton = "<input id='plusTab' type='button' value='+' />"
    tabs.append(requestButton);
    tabs.append(plusButton);

    $("#contentTab0").on('click', function (e) {
        switchTab(0);
    });
    $("#plusTab").on('click', function (e) {
        addContentTab();
    });

    switchTab(0);
}

function addContentTab() {
    var tabs = $("#tabs");
    var count = tabs.children().length - 1;

    var contentTab = "<input id='contentTab" + count + "' type='button' value='Content " + count + "' />";
    $("#plusTab").before(contentTab);
    $("#contentTab" + count).on('click', function (e) {
        switchTab(count);
    });
    tabContents[count] = "";
}
function switchTab(id) {
    tabContents[currentTab] = $("#requestArea").val();
    $("#contentTab" + currentTab).removeClass("activeTab");
    currentTab = id;

    if (tabContents[id] != null) {
        $("#requestArea").val(tabContents[id])
    }
    else {
        clearTextArea();
    }

    $("#contentTab" + id).addClass("activeTab");
}
function initEvents() {
    $('#clearButton').on('click', function (e) {
        clearTextArea();
    });
    $('#clearLog').on('click', function (e) {
        clearLog();
    });

    $('#serverMinMax').on('click', function (e) {
        togglePanel($("#serverPanel"), $('#serverMinMax'));
    });

    $('#loginMinMax').on('click', function (e) {
        togglePanel($("#loginPanel"), $('#loginMinMax'));
    });
    $('#decreaseDisplay').on('click', function (e) {
        decreaseDisplay();
    });
    $('#increaseDisplay').on('click', function (e) {
        increaseDisplay();
    });
    $("#sendButton").on('click', function (e) {
        saveState();
        switchTab(0);
        parseRequests($("#requestArea").val(), tabContents);
    });
    $(window).on('resize', function (e) {
        resizePanels();
    });
}
function togglePanel(panel, self) {
    $(panel).toggle();
    if ($(self).val() == "-") {
        $(self).val("+");
    }
    else
        $(self).val("-");
}
function resizePanels() {
    if ($("#rightPanel").css("width") != "50%") {
        $("#rightPanel").css("width", "50%");
        $("#leftPanel").css("width", "50%");
    }
    var rightPanelTop = $("#rightPanel").offset().top;
    if (rightPanelTop > 10) {
        $("#rightPanel").css("width", "100%");
        $("#leftPanel").css("width", "100%");
    }
}
function clearTextArea() {
    $('#requestArea').val('');
}
function clearLog() {
    $('#log').html('');
}

function decreaseDisplay() {
    var flex = parseFloat($('#contentDisplay').css("flex-grow"));
    if (flex > 0)
        flex -= 0.2;

    if (flex < 0)
        flex = 0;
    updateDisplaySize(flex);
}

function increaseDisplay() {
    var flex = parseFloat($('#contentDisplay').css("flex-grow"));

    if (flex < 1)
        flex += 0.2;

    if (flex > 1)
        flex = 1;
    updateDisplaySize(flex);
}

function updateDisplaySize(flex) {
    flex = Math.round(flex * 100) / 100;
    $('#contentDisplay').show();
    $('#logDisplay').show();
    $('#clearLog').show();

    $('#contentDisplay').css("flex-grow", flex + "");
    $('#logDisplay').css("flex-grow", (1 - flex) + "");
    if (flex == 1) {
        $('#logDisplay').hide();
        $('#clearLog').hide();
    }
    else if (flex == 0)
        $('#contentDisplay').hide();
}