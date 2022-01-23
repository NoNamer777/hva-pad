/**
 *  Controller for the challenges page
 *
 *  @author Oscar Wellner
 */
function challengesController(controllerData) {
    // an reference to the challenges view
    var challengesView,
        selectedChallenge = undefined,
        selectedName = undefined,
        selectedList = undefined,
        warningCount = 0,
        startDate,
        endDate,
        totalPoints = 0,
        challengedUser,
        challengedGroup;

    function initialize() {
        $.get("views/user/challenges.html")
            .done(setup)
            .fail(error);
    }

    // is called when the challenges view is found
    function setup(data) {
        // links the fetched data to the variable
        challengesView = $(data);

        if (!jQuery.isEmptyObject(controllerData)) {
            if (jQuery.isArray(controllerData)) {
                challengedGroup = controllerData;
            } else {
                challengedUser = controllerData;
            }
        }

        fetchAllChallenges();

        // hides the taken challenges box when there is no user logged in
        if(session.get("user")) {
            if (challengedUser || challengedGroup) {
                challengesView.find(".buttonsBox")[0].style.display = "block";
                challengesView.find(".takenChallengesBox")[0].style.display = "none";
                challengesView.find(".availableChallengesBox")[0].style.transform = "translate(160px, 0)";
                challengesView.find(".buttonsBox")[0].style.transform = "translate(80px, 0)";
            } else {
                challengesView.find(".takenChallengesBox")[0].style.display = "block";
                challengesView.find(".buttonsBox")[0].style.display = "block";
                fetchUserChallenges();
            }
        } else {
            challengesView.find(".takenChallengesBox")[0].style.display = "none";
            challengesView.find(".buttonsBox")[0].style.display = "none";
            challengesView.find(".availableChallengesBox")[0].style.transform = "translate(160px, 0)";
        }

        challengesView.find(".createChallenge").on("click", openCreateChallengeView);
        challengesView.find(".takeChallenge").on("click", function () {
            if (selectedChallenge) {
                openTakeChallengeView(selectedChallenge);
            }
        });

        // empties the center content and adds the fetched challenges view
        $(".center").empty().append(challengesView);
    }

    // is called when the challenges view is not found
    function error() {
        $(".center").html("Failed to load the Challenges content!");
    }

    // fetches all challenges from the DB
    function fetchAllChallenges() {
        challengesView.find(".availableChallengesList").empty();

        databaseManager
            .query("select * from challenge")
            .done(function (data) {
                createChallengeTiles(data);

                if (data.length === 0) {
                    challengesView.find(".availableChallengesList")[0].innerHTML = "Zo te zien zijn er nog geen uitdagingen" +
                        " gemaakt! <br>Ben jij de eerste om een uitdaging te maken?";
                    challengesView.find(".takeChallenge")[0].disabled = true;
                } else {
                    challengesView.find(".takeChallenge")[0].disabled = false;
                    challengesView.find(".availableChallengesList")[0].innerHTML = "";
                }
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    // fetches all challenges that the user is participating in
    function fetchUserChallenges() {
        challengesView.find(".takenChallengesList").empty();

        databaseManager
            .query("select C.*, UC.dateChallengeTaken, UC.dateChallengeEnd, UC.sendApproval, UC.receivedApproval from user_challenge UC left join challenge C on UC.challengeID = C.id where UC.challenger = ?",
                session.get("user"))
            .done(function (data) {
                createChallengeTiles(data);

                if (data.length === 0) {
                    challengesView.find(".takenChallengesList")[0].innerHTML = "Het ziet er naar uit dat je nog geen uitdagingen hebt om te doen!";
                }
            })
            .fail(function (reason) {
                console.log(reason);
            });
    }

    // creates tiles for the challenges from the DB
    function createChallengeTiles(challenges) {
        $.get("views/user/challengeTile.html")
            .done(function (tile) {
                for(var i in challenges) {
                    var challengeTile = $(tile);
                    challengeTile.find("#challengeName")[0].innerHTML = challenges[i].name;
                    challengeTile.find("#challengePoints")[0].innerHTML = challenges[i].amountPoints;
                    challengeTile.find("#challengeCreator")[0].innerHTML = challenges[i].creator;
                    challengeTile[0].addEventListener("click", function () {
                        highlightChallenge($(this));
                    });

                    // if a challenge is taken by a user, adds it to the right list, and calculates the remaining time
                    if(challenges[i].dateChallengeTaken) {
                        var challengeTakenDate = new Date(challenges[i].dateChallengeTaken);
                        challengeTakenDate.setDate(challengeTakenDate.getDate() + 1);
                        challengeTile.find("#dateTakenChallenge")[0].innerHTML = challengeTakenDate.toISOString().substr(0, 10);
                        challengeTile.find("#dateTakenChallenge")[0].style.display = "none";

                        if (challenges[i].receivedApproval !== 1 && challenges[i].sendApproval !== 1) {
                            var challengeEndsDate = challenges[i].dateChallengeEnd;
                            var daysRemaining = calculateRemainingTime(challengeEndsDate);

                            if (daysRemaining > 0) {
                                challengeTile.find("#timeRemaining")[0].innerHTML = "Dagen over: " + daysRemaining;
                            } else if (daysRemaining === 0) {
                                challengeTile.find("#timeRemaining")[0].innerHTML = "Laatste dag!";
                            } else {
                                challengeTile.find("#timeRemaining")[0].innerHTML = "Tijd verstreken!";
                                challengeTile.find("#finishChallenge")[0].style.display = "none";
                            }
                            challengeTile.find("#challengeName")[0].style.marginLeft = "-20px";
                            challengeTile.find("#challengePoints")[0].style.marginRight = "-20px";

                            challengeTile.find("#removeChallenge")[0].addEventListener("click", function () {
                                checkDeleteChallenge($(this).parent().parent());
                            });

                            challengeTile.find("#finishChallenge")[0].addEventListener("click", function () {
                                checkFinishChallenge($(this).parent().parent());
                            });
                        } else if (challenges[i].receivedApproval === 1) {
                            challengeTile.find("#finishChallenge")[0].style.display = "none";
                            challengeTile.find("#removeChallenge")[0].style.display = "none";
                            challengeTile.find("#timeRemaining")[0].innerHTML = "Uitdaging afgerond!";
                        } else if (challenges[i].sendApproval === 1) {
                            challengeTile.find("#finishChallenge")[0].style.display = "none";
                            challengeTile.find("#removeChallenge")[0].style.display = "none";
                            challengeTile.find("#timeRemaining")[0].innerHTML = "Wachten op goedkeuring!";
                        }

                        challengesView.find(".takenChallengesList").append(challengeTile);
                    } else {
                        challengeTile.find("#removeChallenge")[0].style.display = "none";
                        challengeTile.find("#finishChallenge")[0].style.display = "none";

                        challengesView.find(".availableChallengesList").append(challengeTile);
                    }
                }
            });
    }

    // calculates the remaining time (in days) of a challenge taken by a user
    function calculateRemainingTime(endDate) {
        var currentDate = new Date();
        currentDate = new Date(currentDate.toISOString().substr(0,10));
        currentDate = currentDate.getTime();

        endDate = new Date(endDate);
        endDate = endDate.getTime();

        var daysRemaining = endDate - currentDate;
        daysRemaining /= 1000; // milliseconds to seconds
        daysRemaining /= 60; // seconds to minutes
        daysRemaining /= 60; // minutes to hours
        daysRemaining /= 24; // hours to days
        daysRemaining = Math.round(daysRemaining);

        return daysRemaining;
    }

    // highlights a challenge when it is clicked
    function highlightChallenge(selectingChallenge) {
        var list = selectingChallenge.parent()[0];

        challengesView.find(".selectedChallenge").removeClass("selectedChallenge");
        if ((selectedChallenge && selectedList) && selectingChallenge.is(selectedChallenge)) {
            selectedChallenge = undefined;
            selectedList = undefined;
        } else if (selectedChallenge && !selectingChallenge.is(selectedChallenge)
            || !selectedChallenge) {
            if (list !== challengesView.find(".takenChallengesList")[0]) {
                selectedChallenge = selectingChallenge;
                selectedChallenge.addClass("selectedChallenge");
            }
        }
    }

    // checks if a user really wants to drop a challenge
    function checkDeleteChallenge(deletedChallenge) {
        if (warningCount === 1) {
            var challengeName = deletedChallenge.find("#challengeName")[0].innerHTML;
            var challengePoints = deletedChallenge.find("#challengePoints")[0].innerHTML;
            var challengeTaken = deletedChallenge.find("#dateTakenChallenge")[0].innerHTML;
            deletedChallenge.remove();

            // removes the challenge from the DB (user_challenge table) and from the taken challenges list of that user
            databaseManager
                .query("delete from user_challenge where challengeID = (select id from challenge where name = ? and amountPoints = ?) and challenger = ? and dateChallengeTaken = ?",
                    [challengeName, challengePoints, session.get("user"), challengeTaken])
                .done(function () {
                    console.log("challenge successfully removed from the users taken challenges in the DB!");
                })
                .fail(function (reason) {
                    console.log(reason);
                });

            challengesView.find("#removeChallengeWarning")[0].innerHTML = "";
            warningCount--;
        } else {
            challengesView.find("#removeChallengeWarning")[0].innerHTML = "Klik nogmaals om je actie te bevestigen!";
            warningCount++;
        }
    }

    // checks if a user really wants to send an approval request to it's teacher
    function checkFinishChallenge(finishedChallenge) {
        if (warningCount === 1) {
            var challengeName = finishedChallenge.find("#challengeName")[0].innerHTML;
            var challengeCreator = finishedChallenge.find("#challengeCreator")[0].innerHTML;
            var challengePoints = finishedChallenge.find("#challengePoints")[0].innerHTML;
            var completionDate = new Date().toISOString().substr(0, 10);
            console.log(completionDate);

            // removes the challenge from the DB (user_challenge table) and from the taken challenges list of that user
            databaseManager
                .query("update user_challenge set sendApproval = 1, completionDate = ? where challengeID = (select id from challenge where name = ? and amountPoints = ? and creator = ?) and challenger = ?",
                    [completionDate, challengeName, challengePoints, challengeCreator, session.get("user")])
                .done(function () {
                    console.log("challenge status successfully updated in the DB!");
                    finishedChallenge.find("#finishChallenge")[0].style.display = "none";
                    finishedChallenge.find("#removeChallenge")[0].style.display = "none";
                    finishedChallenge.find("#timeRemaining")[0].innerHTML = "Wachten op goedkeuring!";
                })
                .fail(function (reason) {
                    console.log(reason);
                });

            challengesView.find("#removeChallengeWarning")[0].innerHTML = "";
            warningCount--;
        } else {
            challengesView.find("#removeChallengeWarning")[0].innerHTML = "Klik nogmaals om je actie te bevestigen!";
            warningCount++;
        }
    }

    // Opens the takeChallengeBox and handles actions in that box accordingly
    function openTakeChallengeView() {
        if (selectedList !== challengesView.find(".takenChallengesList")[0]) {
            challengesView.find(".takeChallengeBackground")[0].style.display = "block";
            challengesView.find("#addBook")[0].style.display = "none";
        }

        if (selectedChallenge !== undefined) {
            document.forms["takeChallenge"]["challengeName"].value = selectedChallenge.find("#challengeName")[0].innerHTML;
            challengesView.find("#pointsToWin")[0].innerHTML = selectedChallenge.find("#challengePoints")[0].innerHTML;

            // adds all books that are part of the selected challenge to the list
            databaseManager
                .query("select C.id, C.name 'challenge', B.name 'book' from challenged_book CB inner join challenge C on CB.challengeID = C.id " +
                    "inner join book B on CB.bookISBN = B.ISBN where C.name = ? and C.creator = ?",
                    [selectedChallenge.find("#challengeName")[0].innerHTML, selectedChallenge.find("#challengeCreator")[0].innerHTML])
                .done(function (data) {
                    // adds the books that are part of the selected challenge to the list
                    challengesView.find("#bookList ul").empty();

                    for (var i = 0; i < data.length; i++) {
                        var liBook = document.createElement("li");
                        liBook.setAttribute("id", "liBook");
                        liBook.innerHTML = data[i].book;

                        challengesView.find("#bookList ul").prepend(liBook);
                    }
                })
                .fail(function (reason) {
                    console.log(reason);
                });

            // updates the start- and end date values
            document.forms["takeChallenge"]["challengeStartDate"].addEventListener("change", function () {
                startDate = new Date(this.value);

                startDate = startDate.toISOString().substr(0, 10);
            });

            document.forms["takeChallenge"]["challengeEndDate"].addEventListener("change", function () {
                endDate = new Date(this.value);

                endDate = endDate.toISOString().substr(0, 10);

                manipulatePoints();
            });

            // handles request to take the challenge
            challengesView.find("#takeChallenge").on("click", function () {
                challengesView.find("#takeChallengeWarning")[0].innerHTML = "";
                document.forms["takeChallenge"]["challengeStartDate"].style = "";
                document.forms["takeChallenge"]["challengeEndDate"].style = "";

                // checks if the start- and end dates are given, gives an error when that's not the case
                if (!startDate || !endDate) {
                    challengesView.find("#takeChallengeWarning")[0].innerHTML = "Je moet je datums nog bepalen";
                    if (!startDate && !endDate) {
                        document.forms["takeChallenge"]["challengeStartDate"].style.borderColor = "red";
                        document.forms["takeChallenge"]["challengeEndDate"].style.borderColor = "red";
                    } else if (!startDate) {
                        document.forms["takeChallenge"]["challengeStartDate"].style.borderColor = "red";
                    } else {
                        document.forms["takeChallenge"]["challengeEndDate"].style.borderColor = "red";
                    }
                } else {
                    var queryData =
                            [selectedChallenge.find("#challengeName")[0].innerHTML, selectedChallenge.find("#challengeCreator")[0].innerHTML,
                                session.get("user"), startDate, endDate];
                    if (challengedUser) {
                        queryData =
                            [selectedChallenge.find("#challengeName")[0].innerHTML, selectedChallenge.find("#challengeCreator")[0].innerHTML,
                                challengedUser, startDate, endDate];

                        databaseManager
                            .query("insert into user_challenge (challengeID, challenger, dateChallengeTaken, dateChallengeEnd, " +
                                "sendApproval, receivedApproval) values ((select id from challenge where name = ? and creator = ?), ?, ?, ?, 0, 0)", queryData)
                            .done(function () {
                                // closes the takeChallengeBox when a challenge has been taken
                                challengesView.find(".takeChallengeBackground")[0].style.display = "none";
                                challengesView.find(".takenChallengesList").empty();

                                fetchUserChallenges();
                                highlightChallenge(selectedChallenge);

                                if (challengedUser) {
                                    loadController(CONTROLLER_MY_CLASS);
                                    alert("Je hebt een uitdaging gemaakt voor je klasgenoot!");
                                }
                            })
                            .fail(function (reason) {
                                console.log(reason);
                            });
                    } else if (challengedGroup) {
                        for (var i = 0; i < challengedGroup.length; i++) {
                            queryData =
                                [selectedChallenge.find("#challengeName")[0].innerHTML, selectedChallenge.find("#challengeCreator")[0].innerHTML,
                                    challengedGroup[i], startDate, endDate];

                            databaseManager
                                .query("insert into user_challenge (challengeID, challenger, dateChallengeTaken, dateChallengeEnd, " +
                                    "sendApproval, receivedApproval) values ((select id from challenge where name = ? and creator = ?), ?, ?, ?, 0, 0)", queryData)
                                .fail(function (reason) {
                                    console.log(reason);
                                });
                        }
                        queryData =
                            [session.get("user") ,selectedChallenge.find("#challengeName")[0].innerHTML, selectedChallenge.find("#challengeCreator")[0].innerHTML,
                                startDate, endDate];

                        databaseManager
                            .query("insert into group_challenge (groupID, challengeID, dateChallengeTaken, dateChallengeEnd, " +
                                "winner) values ((select id from `group` where moderator = ?), " +
                                "(select id from challenge where name = ? and creator = ?), ?, ?, null)", queryData)
                            .fail(function (reason) {
                                console.log(reason);
                            });

                        // closes the takeChallengeBox when a challenge has been taken
                        challengesView.find(".takeChallengeBackground")[0].style.display = "none";
                        challengesView.find(".takenChallengesList").empty();

                        if (challengedGroup) {
                            loadController(CONTROLLER_MY_CLASS);
                            alert("Je hebt een uitdaging gemaakt voor je groep!");
                        }
                    } else {
                        databaseManager
                            .query("insert into user_challenge (challengeID, challenger, dateChallengeTaken, dateChallengeEnd, " +
                                "sendApproval, receivedApproval) values ((select id from challenge where name = ? and creator = ?), ?, ?, ?, 0, 0)", queryData)
                            .done(function () {
                                // closes the takeChallengeBox when a challenge has been taken
                                challengesView.find(".takeChallengeBackground")[0].style.display = "none";
                                challengesView.find(".takenChallengesList").empty();

                                fetchUserChallenges();
                                highlightChallenge(selectedChallenge);

                                if (challengedUser) {
                                    loadController(CONTROLLER_MY_CLASS);
                                    alert("Je hebt een uitdaging gemaakt voor je klasgenoot!");
                                }
                            })
                            .fail(function (reason) {
                                console.log(reason);
                            });
                    }
                }
                return false;
            });
            closeChallengeView();
        }
    }

    // Opens the takeChallengeBox completely empty for a new challenge
    function openCreateChallengeView() {
        challengesView.find(".takeChallengeBackground")[0].style.display = "block";
        document.forms["takeChallenge"]["challengeName"].value = "";
        challengesView.find("#pointsToWin")[0].innerHTML = "";
        challengesView.find("#bookList ul").empty();
        challengesView.find("#addBook")[0].style.display = "block";

        // starts the books selection from the DB
        challengesView.find("#addBook").on("click", function () {
            if (challengesView.find("#addBook")[0].getAttribute("class") === "fas fa-plus-circle") {
                addBook();
            }
        });

        // adds eventListeners to the date fields to update the start- and end dates
        document.forms["takeChallenge"]["challengeStartDate"].addEventListener("change", function () {
            startDate = new Date(this.value);

            startDate = startDate.toISOString().substr(0, 10);
            manipulatePoints();
        });

        document.forms["takeChallenge"]["challengeEndDate"].addEventListener("change", function () {
            endDate = new Date(this.value);

            endDate = endDate.toISOString().substr(0, 10);
            manipulatePoints();
        });

        // handles everything when the 'create challenge' button is clicked
        challengesView.find("#takeChallenge").on("click", function () {
            // resets the border styles if necessary
            document.forms["takeChallenge"]["challengeEndDate"].style = "";
            document.forms["takeChallenge"]["challengeStartDate"].style = "";
            challengesView.find("#bookList ul")[0].style = "";
            document.forms["takeChallenge"]["challengeName"].style = "";

            var newChallengeName = document.forms["takeChallenge"]["challengeName"].value,
                newChallengePoints = challengesView.find("#pointsToWin")[0].innerHTML,
                newChallengeBooks = [];

            var challengeBooks = challengesView.find("#bookList ul").children();
            for (var i = 0; i < challengeBooks.length; i++) {
                newChallengeBooks.push(challengeBooks[i].innerHTML);
            }

            // checks if all fields are filled in and handles accordingly
            if (newChallengeName !== "" && newChallengeBooks.length !== 0 && newChallengePoints !== ""
                && startDate !== undefined && endDate !== undefined) {
                // adds the newly made challenge to the available challenges in the DB
                databaseManager
                    .query("insert into challenge values (null, ?, ?, ?)", [newChallengeName, session.get("user"), newChallengePoints])
                    .done(function () {
                        console.log("successfully created new challenge");

                        // iterates over the books that belong to the challenge and adds them to the correct table in the DB
                        for (var j in newChallengeBooks) {
                            databaseManager
                                .query("insert into challenged_book values ((select ISBN from book where name = ?), " +
                                    "(select id from challenge where name = ? and creator = ? order by id desc limit 1))",
                                    [newChallengeBooks[j], newChallengeName, session.get("user")])
                                .done(function () {
                                    console.log("Successfully added a book to the challenge");
                                })
                                .fail(function (reason) {
                                    console.log(reason);
                                });
                        }

                        // adds the newly made challenge to the user's challenge list in the DB
                        if (challengedUser) {
                            databaseManager
                                .query("insert into user_challenge values ((select id from challenge where name = ?), ?, ?, ?, null, 0, 0)",
                                    [newChallengeName, challengedUser ,startDate, endDate])
                                .done(function () {
                                    loadController(CONTROLLER_MY_CLASS);
                                    alert("Je hebt succesvol een uitdaging gemaakt en die gegeven aan een leerling uit je groep.");
                                })
                                .fail(function (reason) {
                                    console.log(reason);
                                });
                        } else if (challengedGroup) {
                            databaseManager
                                .query("insert into group_challenge values ((select id from `group` where moderator = ?), " +
                                        "(select id from challenge where name = ?), ?, ?, null)",
                                    [session.get("user"), newChallengeName, startDate, endDate])
                                .done(function () {
                                    for (var i = 0; i < challengedGroup.length; i++) {
                                        databaseManager
                                            .query("insert into user_challenge values (" +
                                                "(select id from challenge where name = ? order by id desc limit 1), ?, ?, ?, null, 0, 0)",
                                                [newChallengeName, challengedGroup[i] ,startDate, endDate])
                                            .fail(function (reason) {
                                                console.log(reason);
                                            });
                                    }
                                })
                                .fail(function (reason) {
                                    console.log(reason);
                                });

                            loadController(CONTROLLER_MY_CLASS);
                            alert("Je hebt succesvol een uitdaging gemaakt en die aan alle leerlingen in de groep gegeven.");
                        } else {
                            databaseManager
                                .query("insert into user_challenge values ((select id from challenge where name = ?), ?, ?, ?, null, 0, 0)",
                                    [newChallengeName, session.get("user") ,startDate, endDate])
                                .done(function () {
                                    // refreshes both list of challenges
                                    fetchAllChallenges();
                                    fetchUserChallenges();

                                    // closes the create challenge box
                                    challengesView.find(".takeChallengeBackground")[0].style.display = "none";
                                    startDate = undefined;
                                    endDate = undefined;
                                })
                                .fail(function (reason) {
                                    console.log(reason);
                                });
                        }
                    })
                    .fail(function (reason) {
                        console.log(reason);
                    });
            } else {
                // checks which item needs to have a value and makes it red to easily identify
                if (newChallengeName === "") {
                    document.forms["takeChallenge"]["challengeName"].style.borderColor = "#ec2127";
                }
                if (newChallengeBooks.length === 0) {
                    challengesView.find("#bookList ul")[0].style.borderColor = "#ec2127";
                }
                if (newChallengePoints === "") {
                    console.log("something went wrong while calculating the points!");
                }
                if (startDate === undefined) {
                    document.forms["takeChallenge"]["challengeStartDate"].style.borderColor = "#ec2127";
                }
                if (endDate === undefined) {
                    document.forms["takeChallenge"]["challengeEndDate"].style.borderColor = "#ec2127";
                }
                if (challengesView.find("#addBook")[0].getAttribute("class") === "fas fa-check-circle") {
                    alert("Je bent vergeten om de boeken die je wilt toevoegen bij de uitdaging te bevestigen!")
                }
            }

            // keeps the page from refreshing
            return false;
        });

        closeChallengeView();
    }

    // handles the actions required to add a book to a new challenge
    function addBook() {
        var addBookBt =challengesView.find("#addBook");
        var bookToAdd = undefined;
        addBookBt[0].setAttribute("class", "fas fa-check-circle");

        var newBookDropdwn = document.createElement("select");
        var firstOption = document.createElement("option");
        firstOption.innerHTML = "Kies een boek om toe te voegen.";

        newBookDropdwn.append(firstOption);

        // fetches all books from the DB and adds them to the choice dropdown
        databaseManager
            .query("select name from book")
            .done(function (data) {
                for (var i in data) {
                    var bookTitle = document.createElement("option");
                    bookTitle.setAttribute("id", data[i].name);
                    bookTitle.innerHTML = data[i].name;
                    bookTitle.value = data[i].name;

                    newBookDropdwn.append(bookTitle);
                }

                // updates the to be added book variable to the new value
                newBookDropdwn.addEventListener("change", function () {
                   bookToAdd = newBookDropdwn.value;
                });

                challengesView.find("#addBook").on("click", function () {
                    /* if a book is selected and the 'add book' button is a check sign, adds the book to the challenge booklist,
                     * changes the button back to its original state, and removes the dropdown */
                    if (addBookBt[0].getAttribute("class") === "fas fa-check-circle" && bookToAdd !== undefined) {
                        challengesView.find("#bookList ul")[0].lastChild.remove();

                        var newBook = document.createElement("li");
                        newBook.setAttribute("id", "liBook");
                        newBook.innerHTML = bookToAdd;

                        challengesView.find("#bookList ul")[0].append(newBook);
                        challengesView.find("#addBook")[0].setAttribute("class", "fas fa-plus-circle");
                        manipulatePoints();
                        bookToAdd = undefined;
                    }
                });
            })
            .fail(function (reason) {
                console.log(reason);
            });

        challengesView.find("#bookList ul").append(newBookDropdwn);
    }

    // sets the points that the user is able to win from the challenge
    function manipulatePoints() {
        var initialPoints = challengesView.find("#pointsToWin")[0].innerHTML,
            startDate = document.forms["takeChallenge"]["challengeStartDate"].value,
            endDate = document.forms["takeChallenge"]["challengeEndDate"].value,
            books = challengesView.find("#bookList ul").children(),
            bookList = [];

        for (var i = 0; i < books.length; i++) {
            bookList.push(books[i].innerHTML);
        }

        /* todo calculate points based on amount of days to complete the challenge, giving compensation if someone is dyslexic */

        addBookPoints(bookList, updatePoints)
    }

    // add the flat points that the books provide
    function addBookPoints(bookList, callBack) {
        totalPoints = 0;

        databaseManager
            .query("select * from book")
            .done(function (data) {
                for (var j in data) {
                    for (var k in bookList) {
                        if (data[j].name === bookList[k]) {
                            totalPoints += data[j].amountPoints;
                        }
                    }
                }

                callBack();
            })
            .fail(function (reason) {
                console.log(reason);
        });
    }

    // updates the visual of the 'points to win'
    function updatePoints() {
        challengesView.find("#pointsToWin")[0].innerHTML = totalPoints;
    }

    // closes the take challenge box if it's opened
    function closeChallengeView() {
        challengesView.find("#exitButton").on("click", function () {
            challengesView.find(".takeChallengeBackground")[0].style.display = "none";
            startDate = undefined;
            endDate = undefined;
        });
    }

    // starts the initialization of the challenges page
    initialize();
}