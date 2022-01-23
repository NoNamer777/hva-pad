/**
 *  Controller for the home page
 *
 *  @author Christian Wegerer
 */
function homeController() {
    // a reference to the home view
    var homeView;

    function initialize() {
        // determines which homepage to use
        $.get("views/visitor/home.html")
            .done(setup)
            .fail(error);
    }

    // is called when the home view is found
    function setup(data) {
        // links the fetched data for the user that is visiting to site to the variable
        homeView = $(data);

        // loads a list of users with the highest number of points
        addSearchbarListener();
        requestFeaturedBook();
        requestLeaderboardRankings();

        // empties the center content and adds the fetched home view
        $(".center").empty().append(homeView);
    }

    function addSearchbarListener() {
        homeView.find(".search-container").on("click", "button", function() {
            var userSearch = $(".searchTerm").val();
            requestMatchingUsers(userSearch);
        })
    }

    function requestMatchingUsers(userSearch) {
        console.log(userSearch);

        var username = $(".searchTerm").val();

        databaseManager
            .query("SELECT username, points FROM pad_database.user WHERE username LIKE ?",
                [username + '%'])
            .done(function (data) {
                createMatchingResults(data, homeView.find(".searchResultsWrapper"));
            })
            .fail(error)
    }

    function createMatchingResults(matchedUsers, resultsWrapper) {
        resultsWrapper.empty();
        $.get("data/html-templates/homeSearchResult.html")
            .done(function (template) {
                for (var i = 0; i < matchedUsers.length; i++) {
                    var searchResultTemplate = $(template);
                    searchResultTemplate.find("#username")[0].innerHTML = matchedUsers[i].username;
                    searchResultTemplate.find("#points")[0].innerHTML = matchedUsers[i].points;

                    resultsWrapper.append(searchResultTemplate);
                }
            })
            .fail(function (reason) {
                console.log(reason);
            });

    }

    function requestFeaturedBook() {
        databaseManager
            .query("SELECT B.name, bookSummary FROM book B WHERE bookSummary IS NOT NULL")
            .done(function (data) {
                createFeaturedBook(data, homeView.find(".BOTWcontainer"));
            })
            .fail(error)
    }

    function createFeaturedBook(bookData, BOTWcontainer) {
        for (var i = 0; i < bookData.length; i++) {
            var featuredBook = $(BOTWcontainer);
            featuredBook.find(".BOTWtitle")[0].innerHTML = bookData[i].name;
            featuredBook.find(".BOTWsummary")[0].innerHTML = bookData[i].bookSummary;

            BOTWcontainer.append(featuredBook);
        }
    }

    // requests the username and points from the DB in descending order
    function requestLeaderboardRankings() {
        databaseManager.query("SELECT username, points FROM user ORDER BY points DESC")
            .done(function (data) {
                createLeaderboard(data, homeView.find(".activeLeaderboard"));
            })
            .fail(error)
    }

    // creates the leaderboard tile for the retrieved usernames and points, and adds them into a list
    function createLeaderboard(leaderboardRankings, list) {

        $.get("views/visitor/leaderboardRow.html")
            .done(function (tile) {
                for (var i = 0; i < 10; i++) {
                    var lileaderboardItem = document.createElement("li");
                    lileaderboardItem.setAttribute("class", "leaderboardItem");
                    var leaderboardEntry = leaderboardRankings[i];
                    var leaderboardEntryName = leaderboardEntry.username;
                    var leaderboardEntryPoints = leaderboardEntry.points;

                    var leaderboardRow = $(tile);

                    leaderboardRow.find("#leaderboardEntryName")[0].innerHTML = leaderboardEntryName;
                    leaderboardRow.find("#leaderboardEntryPoints")[0].innerHTML = leaderboardEntryPoints;

                    lileaderboardItem.appendChild(leaderboardRow[0]);
                    list.append(lileaderboardItem);
                }
            })

    }

    // is called when the home view is not found
    function error() {
        $(".center").html("Failed to load the Home content!");
    }

    // starts the initialization of the home page
    initialize();
}
