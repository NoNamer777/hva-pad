/**
 *  Controller for the admin home page
 *
 *  @author
 */
function adminHomeController() {
    // a reference to the adminHome view
    var adminHomeView,
        warningCount = 0;

    function initialize() {
        //determines which homepage to use
        $.get("views/admin/admin-home.html")
            .done(setup)
            .fail(error);
    }

    // is called when the admin home view is found
    function setup(data) {
        // links the fetched data for the user that is visiting the site to the variable
        adminHomeView = $(data);

        // loads a list of user challenges
        requestUserChallengeList();
        requestApprUserChallengeList();
        requestGroupChallengeList();

        // empties the center content and adds the fetched admin home view
        $(".center").empty().append(adminHomeView);
    }

    // requests the entire user_challenge list
    function requestUserChallengeList() {
        //databaseManager.query("SELECT * FROM user_challenge WHERE sendApproval = 1  AND receivedApproval = 0 ORDER BY challengeID ASC")
        databaseManager.query("SELECT U.*, C.name, C.amountPoints FROM user_challenge U " +
            "LEFT JOIN challenge C ON U.challengeID = C.id " +
            "WHERE sendApproval = 1  AND receivedApproval = 0 ORDER BY challengeID ASC")
            .done(function (data) {
                createUserChallengeList(data, adminHomeView.find(".unnapprovedStudentList"));
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    function requestApprUserChallengeList() {
        databaseManager.query("SELECT U.*, C.name, C.amountPoints FROM user_challenge U " +
                "LEFT JOIN challenge C ON U.challengeID = C.id " +
                "WHERE sendApproval = 1  AND receivedApproval = 1 ORDER BY challengeID ASC")
            .done(function (data) {
                createApprUserChallengeList(data, adminHomeView.find(".approvedStudentList"));
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    function requestGroupChallengeList() {
        databaseManager.query("SELECT P.*, G.name, G.moderator, C.winner FROM group_participants P " +
                "LEFT JOIN pad_database.group G ON P.groupID = G.id LEFT JOIN group_challenge C ON P.groupID = C.groupID")
            .done(function (data) {
                createGroupChallengeList(data, adminHomeView.find(".groupStudentList"));
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    // creates the userChallenge tile for the retrieved challenge data, and adds it into a list
    function createUserChallengeList(userChallenges, list) {
        console.log(userChallenges);

        $.get("views/admin/challengeRow.html")
            .done(function (tile) {
                for (var i = 0; i < userChallenges.length; i++) {
                    var lichallengeItem = document.createElement("li");
                    lichallengeItem.setAttribute("class", "challengeItem");
                    var challengeEntry = userChallenges[i];
                    var challengeEntryDateTimeTaken = challengeEntry.dateChallengeTaken;
                    var challengeEntryDateTaken = new Date(challengeEntryDateTimeTaken).toISOString().substr(0, 10);
                    var challengeEntryDateTimeEnd = challengeEntry.dateChallengeEnd;
                    var challengeEntryDateEnd = new Date(challengeEntryDateTimeEnd).toISOString().substr(0, 10);
                    var challengeAmountPoints = challengeEntry.amountPoints;

                    var challengeRow = $(tile);

                    challengeRow.find("#challengeEntryID")[0].innerHTML = challengeEntry.challengeID;
                    challengeRow.find("#challengeEntryID")[0].style.display = "none";
                    challengeRow.find("#challengeEntryChallenger")[0].innerHTML = challengeEntry.challenger;
                    challengeRow.find("#challengeEntryDateTaken")[0].innerHTML = challengeEntryDateTaken.split("-").reverse().join("-");
                    challengeRow.find("#challengeEntryDateEnd")[0].innerHTML = challengeEntryDateEnd.split("-").reverse().join("-");
                    challengeRow.find("#challengeAmountPoints")[0].innerHTML = challengeAmountPoints;

                    lichallengeItem.appendChild(challengeRow[0]);
                    list.append(lichallengeItem);

                    $('.approveBtn').attr('id', function(i) {
                        return 'btn'+(i+1);
                    });

                    $(".unnapprovedStudentList li li").on("click", "button", function() {
                        var challengeEntryID = $(this).parent().parent().find("#challengeEntryID").text();
                        var challengerEntry = $(this).parent().parent().find("#challengeEntryChallenger").text();
                        var challengeAmountPoints = $(this).parent().parent().find("#challengeAmountPoints").text();
                        $(this).parents(".challengeItem")[0].style.backgroundColor = "green";
                        approveChallenge($(this).parent().parent(), this.id, challengeEntryID, challengerEntry, challengeAmountPoints);
                    });
                }
            })
    }

    function createApprUserChallengeList(userChallenges, list) {
        console.log(userChallenges);

        $.get("views/admin/approvedChallengeRow.html")
            .done(function (tile) {
                for (var i = 0; i < userChallenges.length; i++) {
                    var liApprChallengeItem = document.createElement("li");
                    liApprChallengeItem.setAttribute("class", "apprChallengeItem");
                    var challengeEntry = userChallenges[i];
                    var challengeEntryDateTimeTaken = challengeEntry.dateChallengeTaken;
                    var challengeEntryDateTaken = new Date(challengeEntryDateTimeTaken).toISOString().substr(0, 10);
                    var challengeEntryDateTimeEnd = challengeEntry.completionDate;
                    var challengeEntryDateEnd = new Date(challengeEntryDateTimeEnd).toISOString().substr(0, 10);
                    var challengeAmountPoints = challengeEntry.amountPoints;

                    var challengeRow = $(tile);

                    challengeRow.find("#apprChallengeEntryID")[0].innerHTML = challengeEntry.challengeID;
                    challengeRow.find("#apprChallengeEntryID")[0].style.display = "none";
                    challengeRow.find("#apprChallengeEntryChallenger")[0].innerHTML = challengeEntry.challenger;
                    challengeRow.find("#apprChallengeEntryDateTaken")[0].innerHTML = challengeEntryDateTaken.split("-").reverse().join("-");
                    challengeRow.find("#apprChallengeCompletionDate")[0].innerHTML = challengeEntryDateEnd.split("-").reverse().join("-");
                    challengeRow.find("#apprChallengeAmountPoints")[0].innerHTML = challengeAmountPoints;

                    liApprChallengeItem.appendChild(challengeRow[0]);
                    list.append(liApprChallengeItem);

                    $('.deleteBtn').attr('id', function(i) {
                        return 'dltBtn'+(i+1);
                    });

                    $(".approvedStudentList li li").on("click", "button", function() {
                        var apprChallengeEntryID = $(this).parent().parent().find("#apprChallengeEntryID").text();
                        var apprChallengerEntry = $(this).parent().parent().find("#apprChallengeEntryChallenger").text();
                        $(this).parents(".apprChallengeItem")[0].style.backgroundColor = "red";
                        deleteChallenge($(this).parent().parent(), this.id, apprChallengeEntryID, apprChallengerEntry);
                    });
                }
            })

    }

    function createGroupChallengeList(groupChallenges, list) {
        console.log(groupChallenges);

        $.get("views/admin/groupChallengeRow.html")
            .done(function (tile) {
                for (var i = 0; i < groupChallenges.length; i++) {
                    var liGroupChallengeItem = document.createElement("li");
                    liGroupChallengeItem.setAttribute("class", "groupChallengeItem");
                    var groupChallengeEntry = groupChallenges[i];
                    var challengeUsername = groupChallengeEntry.username;
                    var groupName = groupChallengeEntry.name;
                    var groupModerator = groupChallengeEntry.moderator;
                    var groupWinner = groupChallengeEntry.winner;

                    var challengeRow = $(tile);

                    challengeRow.find("#groupChallengerUsername")[0].innerHTML = challengeUsername;
                    challengeRow.find("#groupName")[0].innerHTML = groupName;
                    challengeRow.find("#groupModerator")[0].innerHTML = groupModerator;
                    challengeRow.find("#groupWinner")[0].innerHTML = groupWinner;

                    liGroupChallengeItem.appendChild(challengeRow[0]);
                    list.append(liGroupChallengeItem);
                }
            })

    }

    function approveChallenge(approveCompletedChallenge, buttonID, challengeEntryID) {
        console.log(buttonID, challengeEntryID);

        var challengerID = approveCompletedChallenge.find("#challengeEntryID")[0].innerHTML;
        var challengerEntry = approveCompletedChallenge.find("#challengeEntryChallenger")[0].innerHTML;
        var challengeAmountPoints = approveCompletedChallenge.find("#challengeAmountPoints")[0].innerHTML;

        if (warningCount === 1) {
            // approves the user_challenge by setting receivedApproval to 1
            databaseManager
                .query("UPDATE user_challenge SET receivedApproval = 1 WHERE (challengeID = ?) AND (challenger = ?)",
                    [challengerID, challengerEntry])
                .done( function() {
                    console.log("Succesfully updated receivedApproval and amountPoints for user in the DB");

                    databaseManager.query("UPDATE pad_database.user SET points = points + ? WHERE (username = ?)",
                        [challengeAmountPoints, challengerEntry])
                        .done( function() {
                            console.log("Succesfully updated Points for user in the DB");
                            location.reload();

                        })
                        .fail(function (reason) {
                            console.log(reason);
                        })
                })
                .fail(function (reason) {
                    console.log(reason);
                });

            approveCompletedChallenge.find("#removeUnnapprovedChallenge")[0].innerHTML = "";
            warningCount--;
        } else {
            approveCompletedChallenge.find("#removeUnnapprovedChallenge")[0].innerHTML = "Klik nogmaals om je actie te bevestigen!";
            warningCount++;
        }

    }

    function deleteChallenge(deleteCompletedChallenge, buttonID) {
        console.log(deleteCompletedChallenge, buttonID);

        if (warningCount === 1) {
            var challengeID = deleteCompletedChallenge.find("#apprChallengeEntryID")[0].innerHTML;
            var challengerName = deleteCompletedChallenge.find("#apprChallengeEntryChallenger")[0].innerHTML;
            deleteCompletedChallenge.remove();

            // removes the user_challenge from the DB
            databaseManager
                .query("DELETE FROM user_challenge WHERE (challengeID = ?) AND (challenger = ?)",
                    [challengeID, challengerName])
                .done(function () {
                    console.log(warningCount + " " +  challengeID + challengerName + " successfully removed from the DB");
                })
                .fail(function (reason) {
                    console.log(reason);
                });

            deleteCompletedChallenge.find("#removeApprovedChallenge")[0].innerHTML = "";
            warningCount--;
        } else {
            deleteCompletedChallenge.find("#removeApprovedChallenge")[0].innerHTML = "Klik nogmaals om je actie te bevestigen!";
            warningCount++;
        }

    }

    // is called when the adminHome view is not found
    function error() {
        $(".center").html("Failed to load the Home content!");
    }

    // starts the initialization of the admin-home page
    initialize();
}