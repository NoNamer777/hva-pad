/**
 * Controller for the header, which includes the redirection to the homepage, navigation-bar and a login link
 *
 * @author Oscar Wellner, 500806660, IS103
 */

function headerController() {
    // a reference to the header view
    var headerView;

    function initialize() {
        //determines which header to use
        $.get("views/visitor/header.html")
            .done(setup)
            .fail(error);
    }

    // is called when the header view is found
    function setup(data) {
        // links the fetched data for the user that is visiting to site to the variable
        headerView = $(data);

        headerView.find("a").on("click", handleClick);
        changeStatus(session.get("user"));

        if (session.get("admin") && session.get("admin") === 1) {
            headerView.find("#class").parent()[0].style.display = "block";
            headerView.find("#adminHome").parent()[0].style.display = "block";
        } else if (session.get("user")) {
            headerView.find("#adminHome").parent()[0].style.display = "none";
            headerView.find("#class").parent()[0].style.display = "block";
        } else {
            headerView.find("#adminHome").parent()[0].style.display = "none";
            headerView.find("#class").parent()[0].style.display = "none";
        }

        // empties the center content and adds the fetched header view
        $(".header").empty().append(headerView);
    }

    // is called when the header view is not found
    function error() {
        $(".center").html("Failed to load the Header content!");
    }

    // checks if a user is logged in, and changes the function of the log in button accordingly
    function changeStatus(user) {
        if(user !== undefined) {
            databaseManager
                .query("select * from user where username = ?", session.get("user"))
                .done(function (data) {
                    var user = data[0];

                    headerView.find("#score").html(user.username + ", " + user.points);
                    headerView.find("#score").parent().attr("href", "javascript:void(0)");
                    headerView.find("#score").parent().removeAttr("data-controller");

                    var userOptions = document.createElement("div");
                    userOptions.setAttribute("id", "userOptions");

                    var logOutDiv = document.createElement("a");
                    logOutDiv.setAttribute("href", "");
                    logOutDiv.setAttribute("id", "logOut");
                    logOutDiv.innerHTML = "Uitloggen";

                    userOptions.append(logOutDiv);

                    headerView.find("#score").append(userOptions);
                    headerView.find("#score").on("mouseleave", function () {
                        userOptions.style.display = "none";
                    });

                    headerView.find("#score").on("mouseenter", function () {
                        userOptions.style.display = "block";

                        // handles logout request
                        $("#logOut").on("click", function () {
                            loadController(CONTROLLER_LOGOUT);

                            headerView.find("#score").html("Log In");
                            headerView.find("#score").parent().attr("data-controller", "login");
                            headerView.find("#score").parent().attr("href", "");

                            return false;
                        });

                        $("#myProfileDiv").on("click", function () {
                            loadController(CONTROLLER_SETTINGS);

                            return false;
                        });
                    });
                })
                .fail(function (reason) {
                    console.log(reason);
                });
        }
    }

    // starts the initialization of the header page
    initialize();
}