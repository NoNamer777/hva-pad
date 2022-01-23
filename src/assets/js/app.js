//Global variables
var session = sessionManager();
var databaseManager = databaseManager();

//Constants (sort of)
var CONTROLLER_HEADER = "header";
var CONTROLLER_LOGIN = "login";
var CONTROLLER_LOGOUT = "logout";
var CONTROLLER_HOME = "home";
var CONTROLLER_SETTINGS = "settings";
var CONTROLLER_CHALLENGES = "challenges";
var CONTROLLER_MY_CLASS = "my-class";
var CONTROLLER_OBA = "oba";

//Admin specific constants (sort of)
var CONTROLLER_ADMIN_HOME = "admin-home";

//This function is called when the browser is done loading
$(function () {
    //Always loads the header
    loadController(CONTROLLER_HEADER);

    //Attempts to load the controller from the URL, if that fails, falls back to the home page
    loadControllerFromUrl(CONTROLLER_HOME);

    //setup the database manager
    databaseManager.connect("http://localhost:8080/");
    databaseManager.authenticate("yourtokenhere");
});

//this function is responsible for creating the controller of all views
function loadController(name, controllerData, queryParams) {
    console.log("Loading controller: " + name);

    if (controllerData) {
        console.log(controllerData);
    } else {
        controllerData = {};
    }

    if (name !== CONTROLLER_HEADER) {
        toggleStyle(name);
        setQueryParams(queryParams, name);
    }

    switch (name) {
        case CONTROLLER_HEADER:
            headerController();
            break;
        case CONTROLLER_LOGIN:
            setCurrentController(name);
            loginController();
            break;
        case CONTROLLER_LOGOUT:
            setCurrentController(name);
            handleLogout();
            break;
        case CONTROLLER_HOME:
            setCurrentController(name);
            homeController();
            break;
        case CONTROLLER_CHALLENGES:
            setCurrentController(name);
            challengesController(controllerData);
            break;
        case CONTROLLER_MY_CLASS:
            setCurrentController(name);
            myClassController();
            break;
        case CONTROLLER_OBA:
            setCurrentController(name);
            OBAController();
            break;
        case CONTROLLER_SETTINGS:
            setCurrentController(name);
            settingsController();
            break;
        case CONTROLLER_ADMIN_HOME:
            setCurrentController(name);
            isLoggedIn(homeController, loginController, adminHomeController);
            break;
        default:
            return false;
    }

    return true;
}

function loadControllerFromUrl(fallbackController) {
    var currentController = getCurrentController();

    if (currentController) {
        if (!loadController(currentController)) {
            loadController(fallbackController);
        }
    } else {
        loadController(fallbackController);
    }
}

function getCurrentController() {
    return location.hash.slice(1);
}

function setCurrentController(name) {
    location.hash = name;
}

function setQueryParams(params, controller) {
    resetQueryParams(controller);
    if (params === undefined || params === null || !params) return;

    var base = location.protocol + '//' + location.host + location.pathname;
    var queryString = "?";

    Object.keys(params).forEach(function (key, index) {
        queryString += key + "=" + params[key];
        if (index + 1 !== Object.keys(params).length) {
            queryString += "&";
        }
    });
}

function resetQueryParams(controller) {
    history.replaceState(
        {},
        "",
        location.protocol + '//' + location.host + location.pathname + '#' + controller);
}

function getSearchParams(key) {
    var params = {};
    location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) {
        params[k] = v;
    });
    return key ? params[key] : params;
}

function isLoggedIn(whenYes, whenNo, whenAdmin) {
    if (session.get("user")) {
        if (session.get("admin") && session.get("admin") === 1) {
            whenAdmin();
        } else {
            whenYes();
        }
    } else {
        whenNo();
    }
}

function toggleStyle(name) {
    var controller = (name.indexOf("admin-") >= 0) ? "admin" : name;
    var link = $("head link[rel='stylesheet']")[3];
    var url = "assets/css/pages/" + controller + ".css";

    if (controller !== "logout") {
        $.get(url)
            .done(function () {
                $(link).attr("href", url);
            }).fail(function () {
            console.log("No stylesheet present for current page");
        });
    }
}

function handleLogout() {
    session.remove("admin");
    session.remove("user");

    loadController(CONTROLLER_HOME);
    loadController(CONTROLLER_HEADER);
}

function handleClick() {
    // gets the controller to be loaded
    var controller = $(this)[0].getAttribute("data-controller");

    // passes the controller for further processing
    if(controller !== null) {
        loadController(controller);
    }

    // prevents the page from unwanted reloading
    return false;
}