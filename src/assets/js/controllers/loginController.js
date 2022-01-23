/**
 *  Controller for the login page
 *
 *  @author Oscar Wellner
 */
function loginController() {
    // an reference to the login view
    var loginView;

    // fetches the required html file for the login view
    function initialize() {
        $.get("views/visitor/login.html")
            .done(setup)
            .fail(error);

    }

    // is called when the login view is found
    function setup(data) {
        // links the fetched data to the variable
        loginView = $(data);

        // removes the login-overlay when a user clicks outside of the login box
        $(document).click(function (data) {
            if (data.target === $(".loginContent")[0]) {
                toggleVisibility();
            }
        });

        loginView.find("#loginBt").on("click", checkLogin);

        // empties the center content and adds the fetched home view
        $(".center").empty().append(loginView);
    }

    // is called when the login view is not found
    function error() {
        $(".center").html("Failed to load the Login content!");
    }

    // removes the login view
    function toggleVisibility() {
        loadController(CONTROLLER_HOME);
    }

    // checks the login view for on data that is submitted
    function checkLogin() {
        var username = document.forms["loginForm"]["username"].value;
        var password = document.forms["loginForm"]["password"].value;

        if(username === "" || password === "") {
            // gives the user a message if the username || password isn't filled in
            loginView.find("#warning").html("Gegevens zijn niet correct ingevoerd");
        } else {
            loginView.find("#warning").html("");

            databaseManager
                .query("select username, password, isAdmin from user where username = ?", username)
                .done(function (data) {
                    if (data.length === 0 || password !== data[0].password) {
                        // gives the user a message if the username isn't recognized in the database
                        loginView.find("#warning").html("Gegevens zijn niet correct ingevoerd");
                    } else if (data[0].username === username && data[0].password === password) {
                        session.set("user", username);
                        session.set("admin", data[0].isAdmin);
                        
                        if (session.get("admin")) {
                            loadController(CONTROLLER_ADMIN_HOME);
                        } else {
                            loadController(CONTROLLER_HOME);
                        }
                        // reload necessary to update the login button
                        loadController(CONTROLLER_HEADER);
                    }
                })
                .fail(function (reason) {
                    console.log(reason);
                });
        }

        // prevents the page from reloading
        return false;
    }

    // starts the initialization of the home page
    initialize();
}