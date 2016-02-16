var globalDB = [];
var id = -1;
var featured = false;
var currentLocation = "/";



function preload(author, project) {
    showPreloader();
    loading = true;
    featured = false;
    loadingFeatured = false;
    var url = SERVER + "api/repos?user=" + author + "&format=json&limit=50";

    if (author && author.replace(/^\/|\/$/g, '').indexOf('/') > -1) {
        url = SERVER + "api/search?format=json&query=" + author.replace(/^\/|\/$/g, '');
    } else if (!author || author.length === 0) {
        url = SERVER + "api/repos?home=1&format=json";
        loadingFeatured = true;
    } else if (author == "featured") {
        url = SERVER + "api/repos?liked=1&format=json&limit=50";
        loadingFeatured = true;
    }
    $.getJSON(url, function (data) {
        loading = false;

        if (data.items.message) {
            // no results
            hidePreloader();
            showNoResults(data.items.message);
            return;
        }

        if (!!data.items.project) {
            preload(data.items.user, data.items.repo);
            return;
        }

        globalDB = data.items;
        featured = loadingFeatured;


        for (var i = 0; i < globalDB.length; i++) {
            if (project && globalDB[i] && globalDB[i].link) {
                var last = globalDB[i].link.split('/');
                last = last[last.length - 1].toLowerCase();
                if (last == project && !MOBILE_VERSION) {
                    selected = i;
                }
            }

            var p = globalDB[i].languages;

            if (p.length === 0 || p.message == "Repository access blocked") {
                p = {
                    unknown: 1000
                };
            }
            var converted = [];
            for (var key in p) {
                if (p.hasOwnProperty(key)) {
                    converted.push({
                        type: analyze(key),
                        size: p[key],
                        name: key
                    });
                }
            }
            globalDB[i].files = converted;
        }

        for (var j = 0; j < viewsNum; j++) {
            prepare(j, j);
        }

        if (selected == -1) {
            scrollToTop();
        } else {
            scrollTo(selected);
        }
        hidePreloader();

        if (!introPlayed && (author == "featured" || !author) && !project) {
            intro();
        } else {
            afterIntro();
            updateUI();
        }

    });
}



function analyze(extension) {
    var type = 0;

    for (var i = 0; i < TYPES.length; i++)
        if (TYPES[i] == extension)
            type = i;

    // if (type === 0 && extension != 'unknown')
    //     console.log('ANALYZE: ' + extension + ' not found');

    return type;
}



function showSuggestions(value) {

    $.getJSON(SERVER + "api/search?query=" + value + "&format=json", function (data) {
        var html = '';

        if (data && data.items.length > 0) {
            for (var i = 0; i < data.items.length; i++) {
                var user = data.items[i].toLowerCase();
                html += '<li class="search__item"><a href="/' + user + '" data-username="' + user + '">' + user + '</a></li>';
            }
        }
        else if (data && data.items) {
            var msg = (typeof data.items.project !== 'undefined') ? 'Project not found' : 'User not found';
            html += '<li class="search__item"><q>' + msg + '</q></li>';
        }

        $('.js-search-list').html(html);
        $('.js-search-list').find('a').on('click', function (e) {
            e.preventDefault();
            searchUser($(e.currentTarget).data('username'));
            return false;
        });
        
    });
}



function hideSuggestions() {
    $('.js-search-list').empty();
}



function searchUser(value) {

    if (!value || value.length <= 1)
        return;

    if (!introPlayed)
        afterIntro();

    $(".js-search").val(value);
    selected = -1;
    preload(value);
    TweenMax.killDelayedCallsTo(showSuggestions);
    hideSuggestions();
}



function updateInfo(main, id, staticid) {

    if (!staticid) {
        staticid = id % viewsNum;
        if (staticid < 0)
            return;
    }

    var target = '#descmain';

    if ((id == -1 || !globalDB[id]) && main)
        return;

    if (!main)
        target = '#desc' + staticid;

    if (id === -1 || !globalDB[id]) {
        $(target).html('');
        return;
    }

    var db = globalDB[id];
    if (selected != -1 && main) {
        if (featured)
            updateLocation("featured" + "/" + db.username + "/" + db.project.substr(0, 50));
        else
            updateLocation(db.username + "/" + db.project.substr(0, 50));
    }

    if (!db.description)
        db.description = "";
    if (!db.project)
        db.project = "";

    var filesList = "";
    for (var i = 0; i < db.files.length; i++)
        if (db.files[i].name != 'unknown')
            filesList += '<span class="language" data-language="' + db.files[i].name + '"><span>' + db.files[i].name + ": " + db.files[i].size + "</span></span><br/>";

    var shares = {
        "twitter": {"label": "Twitter", "width": "", "height": ""},
        "fb": {"label": "Facebook", "width": "", "height": ""},
        "gplus": {"label": "Google+", "width": "", "height": ""},
        "tumblr": {"label": "Tumblr", "width": "", "height": ""},
        "pinterest": {"label": "Pinterest", "width": "", "height": ""},
        "link": {"label": "Get Link"}
    };

    var shareList = "";
    $.each(db.share, function (type, url) {
        shareList += '<li><a href="' + url + '" class="button--label" data-share=\'{"type":"' + type + '", "width":"' + shares[type].width + '", "height":"' + shares[type].height + '"}\'><span class="button__icon"><i class="icon-' + type + '"></i></span><span class="button__label">' + shares[type].label + '</span></a></li>';
    });
    if (!MOBILE_VERSION)
        shareList += '<li><a href="#" class="button--label  js-getlink"><span class="button__icon"><i class="icon-link"></i></span><span class="button__label">Get Link</span></a></li>';
    mobileClass = !MOBILE_VERSION && !!isDescOpen ? ' is-shown' : '';
    mobileStyle = MOBILE_VERSION || !isDescOpen ? ' style="display:none"' : '';

    /*jshint multistr: true */
    $(target).html('<div class="grid__rightside">\
            <div class="grid__title"><p>' + db.username + '</br>' + db.project.substr(0, 60) + '</p></div>\
            <div class="grid__wrap' + mobileClass + '"' + mobileStyle + '>\
                <div class="grid__text">\
                    <p>' + db.description.substr(0, 60) + '</p>\
                    <p><br/><br/>' + filesList + '<br/></p>\
                    <p><a href="' + db.link + '" target="_blank">view on GitHub</a></p>\
                </div>\
            </div>\
            <a href="#" class="grid__checkbox js-toggle-desc"></a>\
        </div>\
        <div class="grid__leftside">\
            <div class="grid__like"><a href="#" class="button--label js-like' + (db.is_favourites ? ' is-voted' : '') + '" data-voted="' + (db.is_favourites ? 1 : 0) + '" data-user="' + db.username + '" data-project="' + db.project + '" data-index="' + id + '"><span class="button__icon"><i class="icon-like"></i></span><span class="button__label amount">' + db.favourites + '</span></a></div>' +
            '<div class="grid__share dropdown tablet-hide">\
                <a href="#" class="button--label js-toggle-dropdown"><span class="button__icon"><i class="icon-share"></i></span><span class="button__label">Share</span></a>\
                <ul class="dropdown__list">' + shareList + '</ul>\
            </div>' +
            '<div class="grid__download dropdown tablet-hide">\
                <a href="#" class="button--label js-toggle-dropdown"><span class="button__icon"><i class="icon-download"></i></span><span class="button__label">Download</span></a>\
                <ul class="dropdown__list">\
                    <li><a href="#" class="button--label  js-toggle-download  tablet-hide"><span class="button__icon"><i class="icon-wallpaper"></i></span><span class="button__label">Wallpaper</span></a></li>\
                    <li><a href="#" class="button--label  js-download-gif  tablet-hide"><span class="button__icon"><i class="icon-gif"></i></span><span class="button__label">Gif</span></a></li>\
                </ul>\
            </div>\
        </div>');
}



function updateLocation(location) {
    if (!introPlayed) return;
    if (location) {
        location = location.toLowerCase();
        if(currentLocation != location)
            trackLocation(location);
        currentLocation = location;
    }
}



function trackLocation(location){
    if(typeof dataLayer !== 'undefined')
        dataLayer.push({
            'event':'virtualPageView',
            'url': "/" + location
        });
    $(".input_id").val(location);
    if (HISTORY_ENABLED)
        History.pushState({
            state: 1,
            viewing: location
        }, "Codeology/" + location, "/" + location);
}



function prepare(id, staticid) {

    var db = globalDB[id];
    
    if (id == selected)
        updateInfo(true, id);
    else
        updateInfo(false, id, staticid);
    
    var prevScale = 1;
    if (groups[staticid]) {
        var obj, i;
        for (i = groups[staticid].children.length - 1; i >= 0; i--) {
            obj = groups[staticid].children[i];
            groups[staticid].remove(obj);

        }
        prevScale = groups[staticid].scale.x;
        scene.remove(groups[staticid]);
        groups[staticid] = null;
    }

    if (db) {
        groups[staticid] = new THREE.Group();
        groups[staticid].scale.x = groups[staticid].scale.y = groups[staticid].scale.z = prevScale;
        TweenMax.killDelayedCallsTo(groups[staticid]);
        TweenMax.killTweensOf(groups[staticid]);
        TweenMax.to(groups[staticid].scale, 0.3, {delay: 0.5 * Math.random(), x: 1, y: 1, z: 1, ease: Back.easeOut});
        scene.add(groups[staticid]);

        bug(groups[staticid], db);
    }
}
