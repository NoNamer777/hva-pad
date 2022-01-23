/**
 *  Controller for the OBA page, where users get information about the OBA and it's connection to this app
 *
 *  @author Oscar Wellner
 */
function OBAController() {
    // an reference to the OBA view
    var OBAView;

    function initialize() {
        $.get("views/visitor/OBA.html")
            .done(setup)
            .fail(error);
    }

    // is called when the OBA view is found
    function setup(data) {
        // links the fetched data to the variable
        OBAView = $(data);

        // empties the center content and adds OBA view
        $(".center").empty().append(OBAView);
    }

    // is called when the OBA view is not found
    function error() {
        $(".center").html("Failed to load the OBA view content!");
    }

    // starts the initialization of the home page
    initialize();
}