/**
 *  Controller for the 'My Class' page
 *
 *  @author Oscar Wellner
 */
function myClassController() {
    // an reference to the home view
    var myClassView,
        selectedUser,
        group = [];

    function initialize() {
        //determines which page to load dependent on if a user
        isLoggedIn(loadMyClassView, loadLogin, loadMyClassView);

        function loadLogin() {
            loadController(CONTROLLER_LOGIN);
        }

        function loadMyClassView() {
            $.get("views/user/myClass.html")
                .done(setup)
                .fail(error);
        }
    }

    // is called when my class view is found
    function setup(data) {
        // links the fetched view to the variable
        myClassView = $(data);

        var queryGroupParticipants = "select GP.username, U.points from group_participants GP inner join user U on GP.username = U.username " +
            "where GP.groupID = (SELECT groupID FROM group_participants where username = ?)";
        var queryGroupChallenges = "select C.name 'challenge', C.amountPoints, GC.dateChallengeEnd, GC.winner from group_challenge GC " +
            "inner join challenge C on GC.challengeID = C.id where groupID = (select groupID from group_participants where username = ?)";
        if (session.get("admin")) {
            queryGroupParticipants = "select GP.username, U.points from group_participants GP inner join User u on GP.username = U.username " +
                "where GP.groupID = (select id from `group` where moderator = ?)";
            queryGroupChallenges = "select C.name 'challenge', C.amountPoints, GC.dateChallengeEnd, GC.winner from group_challenge GC " +
                "inner join challenge C on GC.challengeID = C.id where GC.groupID = (select id from `group` where moderator = ?)";
        }

        myClassView.find(".challengeStudent").on("click", challengeUser);
        if (!session.get("admin")) {
            myClassView.find(".challengeStudent")[0].disabled = true;
        }

        databaseManager
            .query(queryGroupParticipants,
                [session.get("user")])
            .done(function (data) {
                fillStudentList(data);
            })
            .fail(function (reason) {
                console.log(reason);
            });

        databaseManager
            .query(queryGroupChallenges,
                [session.get("user")])
            .done(function (data) {
                fillChallengesList(data);
                console.log(data);

                if (data.length === 0) {
                    myClassView.find(".groupChallengesList")[0].innerHTML = "Het ziet er naar uit dat er op dit moment" +
                        " nog geen uitdagingen voor de groep gemaakt zijn door je juf of meester.";
                    myClassView.find(".groupChallengesList")[0].style.padding = "2% 2% 0 2%";
                }
            })
            .fail(function (reason) {
                console.log(reason);
            });

        // empties the center content and adds the fetched view
        $(".center").empty().append(myClassView);
    }

    // is called when my class view is not found
    function error() {
        $(".center").html("Failed to load my class content!");
    }

    function fillStudentList(students) {
        $.get("data/html-templates/userGroup.html")
            .done(function (template) {
                for (var i = 0; i < students.length; i++) {
                    var userGroupTemplate = $(template);
                    group.push(students[i].username);

                    userGroupTemplate.find("#username")[0].innerHTML = students[i].username;
                    userGroupTemplate.find("#totalPoints")[0].innerHTML += students[i].points;
                    userGroupTemplate[0].addEventListener("click", highlightUser);

                    myClassView.find(".myClassList").append(userGroupTemplate);
                }
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    function fillChallengesList(groupChallenges) {
        $.get("data/html-templates/groupChallenge.html")
            .done(function (template) {
                for (var i = 0; i < groupChallenges.length; i++) {
                    var challengeTemplate = $(template);
                    challengeTemplate.find("#challengeName")[0].innerHTML = groupChallenges[i].challenge;
                    challengeTemplate.find("#totalPoints")[0].innerHTML += groupChallenges[i].amountPoints;

                    var timeRemaining = calculateRemainingTime(groupChallenges[i].dateChallengeEnd);
                    if (groupChallenges[i].winner !== null) {
                        challengeTemplate.find("#timeRemaining")[0].innerHTML = "De uitdaging is gewonnen door: " + groupChallenges[i].winner;
                    } else if (timeRemaining > 0) {
                        if (timeRemaining === 1) {
                            challengeTemplate.find("#timeRemaining")[0].innerHTML = "Er is nog " + timeRemaining + " dagen over";
                        } else {
                            challengeTemplate.find("#timeRemaining")[0].innerHTML = "Er zijn nog " + timeRemaining + " dagen over";
                        }
                    } else {
                        challengeTemplate.find("#timeRemaining")[0].innerHTML = "De uitdaging is verlopen!";
                    }

                    challengeTemplate[0].style.cursor = "default";
                    myClassView.find(".groupChallengesList").append(challengeTemplate);
                }
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    function calculateRemainingTime(challengeEndDate) {
        var currentDate = new Date().getTime();
        challengeEndDate = new Date(challengeEndDate).getTime();

        var remainingDays = currentDate - challengeEndDate; // in milliseconds
        remainingDays /= 1000;                              // in seconds
        remainingDays /= 60;                                // in minutes
        remainingDays /= 60;                                // in hours
        remainingDays /= 24;                                // in days
        remainingDays = Math.round(remainingDays) - 1;

        return Math.abs(remainingDays);
    }

    function challengeUser() {
        if (!selectedUser) {
            loadController(CONTROLLER_CHALLENGES, group);
        } else {
            loadController(CONTROLLER_CHALLENGES, selectedUser);
        }
    }

    function highlightUser() {
        var userDiv = $(this);

        myClassView.find(".selected").removeClass("selected");
        if (selectedUser && (selectedUser === userDiv.find("#username")[0].innerHTML ||
                session.get("user") === userDiv.find("#username")[0].innerHTML)) {
            if (!session.get("admin")) {
                myClassView.find(".challengeStudent")[0].disabled = true;
                selectedUser = undefined;
            } else {
                selectedUser = undefined;
            }
        } else if (selectedUser && selectedUser !== userDiv.find("#username")[0].innerHTML) {
            selectedUser = userDiv.find("#username")[0].innerHTML;
            userDiv.addClass("selected");
        } else if (userDiv.find("#username")[0].innerHTML !== session.get("user") && !selectedUser) {
            selectedUser = userDiv.find("#username")[0].innerHTML;
            userDiv.addClass("selected");

            myClassView.find(".challengeStudent")[0].disabled = false;
        }
    }

    // starts the initialization of the home page
    initialize();
}