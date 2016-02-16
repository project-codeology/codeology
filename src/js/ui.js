var preloaderAnimationInterval;
var preloaderAnimationStep = 0;
var preloaderVisible = false;
var dropTimeout = null;
var aboutOpen = false;
var isDescOpen = true;

function intro() {
    if (SKIP_INTRO)
        return;
    setupPopup();
    $("#intro").delay(500).fadeIn(500);
    animatePopupText('intro');
}

function afterIntro() {
    introPlayed = true;

    headerHeight = 70;
    resizePostprocessing();

    $("#intro, #noresults").delay().fadeOut(500);
    $("#ui").addClass('is-shown');
    for (var i = 0; i < viewsNum; i++) {
        if (groups[i]) {
            TweenMax.killDelayedCallsTo(groups[i]);
            TweenMax.killTweensOf(groups[i]);
            TweenMax.to(groups[i].scale, 0.3, {delay: 1, x: 1, y: 1, z: 1});
        }
    }
}

function bindUI() {

    $('.fullscreen').off('click').on('click', toggleFullScreen);
    $('.grid').off('click').on('click', function () {
        showGrid();
    });

    $(window).off('.popup').on('resize.popup', function () {
        setupPopup();
        setupDropdown();
        updateHeaderLinks();
    });

    $('.js-refresh').off('click').on('click', function (e) {
        e.preventDefault();
        screenshot('wallpaper');
        return false;
    });

    $('.js-explore, .js-close-intro, .js-home').off('click').on('click', function (e) {
        e.preventDefault();
        $('.js-search').val("Find a GitHub user");
        $('.js-search-list').empty();
        if (!introPlayed) {
            afterIntro();
            showGrid();
        } else {
            if (!featured)
                preload('featured');
            showGrid('featured');
        }
        scrollToTop();

        $('.js-share.is-active').eq(0).trigger('click');
        $('.js-toggle-info.is-active').eq(0).trigger('click');
        $('.js-toggle-download.is-active').eq(0).trigger('click');
        $('.js-toggle-braintree.is-active').eq(0).trigger('click');
        $('.js-getlink.is-active').eq(0).trigger('click');
        hideSuggestions();

        return false;
    });

    $('.search__icon').off('click').on('click', function (e) {
        e.preventDefault();
        if (!$('.breadcrumbs').is(':empty')) {
            $('.breadcrumbs').empty();
            $('.js-search').val('').focus();
        } else {
            var input = $(e.currentTarget).siblings('.js-search');
            if (!input.val() || input.val() === '' || input.val() === 'Find a GitHub user')
                input.val('').focus();
            else
                input.trigger('enterKey');
        }

        $('.js-share.is-active').eq(0).trigger('click');
        $('.js-toggle-info.is-active').eq(0).trigger('click');
        $('.js-toggle-download.is-active').eq(0).trigger('click');
        $('.js-toggle-braintree.is-active').eq(0).trigger('click');
        $('.js-getlink.is-active').eq(0).trigger('click');

        return false;
    });

    $(".js-toggle-info").off('click').on("click", function (e) {
        e.preventDefault();

        $('.js-share.is-active').eq(0).trigger('click');
        $('.js-toggle-download.is-active').eq(0).trigger('click');
        $('.js-toggle-braintree.is-active').eq(0).trigger('click');
        $('.js-getlink.is-active').eq(0).trigger('click');
        hideSuggestions();

        $(".js-toggle-info").toggleClass('is-active');
        $('#info').fadeToggle(500);
        setupPopup();

        $('body').toggleClass('is-about-open');

        aboutOpen = !aboutOpen;

        if (!!aboutOpen && !MOBILE_VERSION) {
            showCreature();
        }

        return false;
    });

    $(".js-toggle-braintree").off('click').on("click", function (e) {
        e.preventDefault();

        $('.js-share.is-active').eq(0).trigger('click');
        $(".js-toggle-info.is-active").eq(0).trigger('click');
        $('.js-toggle-download.is-active').eq(0).trigger('click');
        $('.js-getlink.is-active').eq(0).trigger('click');
        $(".js-toggle-braintree").toggleClass('is-active');
        hideSuggestions();

        if (!introPlayed)
            $('.js-close-intro').trigger('click');
        $('#braintree').fadeToggle(500);
        setupPopup();
        return false;
    });

    $(".js-share").off('click').on("click", function (e) {
        e.preventDefault();

        $('.js-toggle-info.is-active').eq(0).trigger('click');
        $('.js-toggle-braintree.is-active').eq(0).trigger('click');
        $('.js-toggle-download.is-active').eq(0).trigger('click');
        $('.js-getlink.is-active').eq(0).trigger('click');
        hideSuggestions();

        var $this = $(e.currentTarget);
        var isActive = $this.toggleClass('is-active').hasClass('is-active');
        var html = $('.grid__share .dropdown__list').html();
        $('.js-mobile-share').html(html).toggleClass('is-open', isActive);
        bindUI();
        return false;
    });

    $('.js-getlink').off().on('click', function (e) {
        e.preventDefault();
        $('#getlink').fadeToggle();
        $('#js-getlink-input').val(window.location.href);
        $('#js-getlink-input')[0].setSelectionRange(0, $('#js-getlink-input')[0].value.length);
        $('.js-getlink').toggleClass('is-active');
        setupClipboardCopy();
        return false;
    });

    if (!MOBILE_VERSION) {
        $(".language").unbind('mouseenter mouseleave');
        $(".language").hover(function () {
            rolloverLanguage($(this).data('language'));
        }, function () {
            rolloverLanguage(null);
        });
    }

    // -----------------------------------------------------------------
    //                   .desc event listeners
    // -----------------------------------------------------------------

    $(".desc").off('.like').on("click.like", ".js-like", function (e) {
        var $this = $(this),
                $buttons = $('.js-like[data-index=' + $this.data('index') + ']'),
                $numbers = $buttons.find('.amount'),
                currentDB = globalDB[$(this).data('index')];

        if ($(this).data('voted') == "0") {
            $.getJSON(SERVER + "api/fav?action=add&user=" + $(this).data('user') + "&repo=" + $(this).data('project') + "&format=json", function (data) {
                $numbers.text(data.items.likes);
                currentDB.favourites = data.items.likes;
            });
            $buttons.data('voted', 1).addClass('is-voted');
            currentDB.is_favourites = true;
        } else {
            $.getJSON(SERVER + "api/fav?action=remove&user=" + $(this).data('user') + "&repo=" + $(this).data('project') + "&format=json", function (data) {
                $numbers.text(data.items.likes);
                currentDB.favourites = data.items.likes;
            });
            $buttons.data('voted', 0).removeClass('is-voted');
            currentDB.is_favourites = false;
        }
    });

    $(".desc").off('.desc').on("click.desc", ".js-toggle-desc", function (e) {
        e.preventDefault();
        var wrap = $(e.currentTarget).siblings('.grid__wrap');
        isDescOpen = !isDescOpen;
        if (!!isDescOpen)
            wrap.slideDown().addClass('is-shown');
        else
            wrap.slideUp().removeClass('is-shown');
        return false;
    });

    $(".desc").off('.dropdown').on("click.dropdown", ".js-toggle-dropdown", function (e) {
        e.preventDefault();
        var dropList = $(e.currentTarget).siblings('.dropdown__list'),
                isOpen = dropList.is(':visible'),
                other = $('.dropdown__list').not(dropList);
        dropList.fadeToggle(200);
        other.fadeOut(200);
        if (isOpen) {
            window.clearTimeout(dropTimeout);
            dropList.off('mousemove');
        } else {
            window.clearTimeout(dropTimeout);
            dropTimeout = window.setTimeout(closeDropList, 3000);
            dropList.off('mousemove').on('mousemove', function () {
                window.clearTimeout(dropTimeout);
                dropTimeout = window.setTimeout(closeDropList, 3000);
            });
        }
        return false;
    });

    $(".desc").off('.share').on("click.share", "[data-share]", function (e) {
        e.preventDefault();
        var data = $(e.currentTarget).data('share'),
                winWidth = data.width || 520,
                winHeight = data.height || 320,
                winTop = (screen.height / 2) - (winHeight / 2),
                winLeft = (screen.width / 2) - (winWidth / 2);
        window.open(e.currentTarget.href.replace('%url%', encodeURIComponent(window.location.href)), 'sharer', 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
        return false;
    });

    $(document).off('.wallpaper').on("click.wallpaper", '.js-toggle-download', toggleDownloadPopup);
    $(".desc").off('.gif').on("click.gif", '.js-download-gif', downloadGif);
}


function toggleDownloadPopup(e) {
    e.preventDefault();
    if (!$('#download.popup').is(':visible'))
        showDownloadPopup();
    else
        hideDownloadPopup();
    return false;
}

function showDownloadPopup() {

    $('.js-share.is-active').eq(0).trigger('click');
    $('.js-toggle-info.is-active').eq(0).trigger('click');
    $('.js-toggle-braintree.is-active').eq(0).trigger('click');
    $('.js-getlink.is-active').eq(0).trigger('click');
    hideSuggestions();

    $('.js-toggle-download').addClass('is-active');
    screenshot('wallpaper');
    $('#download.popup').fadeIn(500);
    setupPopup();
}

function downloadGif() {
    screenshot('gif');
}

function hideDownloadPopup() {
    $('.js-toggle-download').removeClass('is-active');
    $('#download.popup').fadeOut(500, function () {
        for (var i = 0; i < 6; i++) {
            $("#wallpaper" + i).attr("src", "").closest('a').attr('href', "").attr('download', "");
        }
    });
}

function closeDropList() {
    $('.dropdown__list').fadeOut(200);
}

var zeroInitialized = false;
function setupClipboardCopy() {
    if (!!zeroInitialized)
        return;
    ZeroClipboard.config({
        swfPath: '/src/js/libs-old/ZeroClipboard.swf',
        forceHandCursor: true
    });
    var client = new ZeroClipboard($('.js-copy'));
    client.on("ready", function (readyEvent) {
        client.on('copy', function (event) {
            event.clipboardData.setData('text/plain', window.location.href);
        });
        client.on("aftercopy", function (event) {
            $('.js-copy').fadeOut(400,
                    function () {
                        $('.js-copy').html('<span data-text="Copied">Copied</span>').fadeIn(600);
                    });
            console.log('Copied text to clipboard: ' + event.data['text/plain']);
            return false;
        });
    });
    client.on('error', function (event) {
        console.log('ZeroClipboard error of type "' + event.name + '": ' + event.message);
        ZeroClipboard.destroy();
        $('.js-copy').remove();
    });
    zeroInitialized = true;
}

function resetUI() {
    $(".js-share.is-active").eq(0).trigger('click');
    $(".js-toggle-info.is-active").eq(0).trigger('click');
    $('.js-toggle-braintree.is-active').eq(0).trigger('click');
    $('.js-toggle-download.is-active').eq(0).trigger('click');
}

function setupPopup() {
    $('.popup').each(function (i, o) {
        $(o).css('margin-top', -$(o).outerHeight() * 0.5);
    });
    $('.needs-scroll').each(function (i, o) {
        if (!$(o).hasClass('has-scroll')) {
            var myscroll = new IScroll(o, {mouseWheel: true});
            $(o).addClass('has-scroll').data('scroll', myscroll);
        } else {
            $(o).data('scroll').refresh();
        }
    });
}

function setupDropdown() {
    $('.dropdown__inner').css('max-height', $(window).height() - 80);
}

function prepareInput() {
    var elem = $(".js-search");

    // Save current value of element
    elem.data('oldVal', elem.val());

    elem.bind("click", function (event) {
        elem.val("");
        $('.js-share.is-active').eq(0).trigger('click');
    });

    // Look for changes in the value
    elem.bind("propertychange change keyup input paste", function (event) {
        // If value has changed...
        var $this = $(event.currentTarget);
        if ($this.data('oldVal') != $this.val()) {

            var value = $this.val();
            $this.data('oldVal', value);

            TweenMax.killDelayedCallsTo(showSuggestions);
            TweenMax.delayedCall(0.6, showSuggestions, [value]);
        }
    });

    elem.bind("blur", function (e) {
        if ($(e.currentTarget).val() === "") {
            elem.val("Find a GitHub user");
            $('.js-search-list').empty();
        }
    });

    elem.bind("enterKey", function (event) {
        var value = $(event.currentTarget).val();
        searchUser(value);
    });

    elem.keyup(function (e) {
        if (e.keyCode == 13)
            $(this).trigger("enterKey");
    });
}

function showPreloader() {
    preloaderVisible = true;
    preloaderAnimationInterval = setInterval(animatePreloader, 80);
    for (var i = 0; i < viewsNum; i++) {
        $('#desc' + i).fadeOut(500);
    }
    for (var j = 0; j < viewsNum; j++) {
        if (groups[j] && introPlayed) {
            TweenMax.killDelayedCallsTo(groups[j]);
            TweenMax.killTweensOf(groups[j]);
            TweenMax.to(groups[j].scale, 0.3 + 0.3 * Math.random(), {delay: 0.1, x: 0.001, y: 0.001, z: 0.001, ease: Back.easeIn});
        }
    }
    $('.loader').fadeIn();
}

function hidePreloader() {
    preloaderVisible = false;
    for (var i = 0; i < viewsNum; i++) {
        $('#desc' + i).fadeIn(500);
    }
    for (var j = 0; j < viewsNum; j++) {
        if (groups[j] && introPlayed) {
            TweenMax.killDelayedCallsTo(groups[j]);
            TweenMax.killTweensOf(groups[j]);
            TweenMax.to(groups[j].scale, 0.3, {delay: 2 + 0.5 * Math.random(), x: 1, y: 1, z: 1, ease: Back.easeOut});
        }
    }
    $('.loader').fadeOut();
    clearInterval(preloaderAnimationInterval);
}

function animatePreloader() {
    var slashes = "";
    for (var i = 0; i < 5; i++) {
        if (i > preloaderAnimationStep && i < preloaderAnimationStep + 5) {
            slashes += "&nbsp;";
        } else {
            slashes += "/";
        }
    }
    preloaderAnimationStep++;

    if (preloaderAnimationStep > 4)
        preloaderAnimationStep = -5;

    $('.loader').html(slashes);
}


function showNoResults(message) {
    for (var i = 0; i < viewsNum; i++) {
        $('#desc' + i).fadeOut(500);
    }
    for (var j = 0; j < viewsNum; j++) {
        if (groups[j] && introPlayed) {
            TweenMax.killTweensOf(groups[j]);
            TweenMax.killDelayedCallsTo(groups[j]);
            TweenMax.to(groups[j].scale, 0.3 + 0.3 * Math.random(), {delay: 0.1, x: 0.001, y: 0.001, z: 0.001, ease: Back.easeIn});
        }
    }
    $('#noresults').delay(500).fadeIn(500)
            .find('.popup__copy p').text(message == '404' ? "Sorry, the page you're looking for doesn't exist." : "User has no projects.");
    $('#ui').removeClass('is-shown');
    $('.js-search-list').empty();
    setupPopup();
    animatePopupText('noresults');
}

function showCreature() {
    //if (globalDB[selected])
    //updateAlphabet(globalDB[selected].link.replace(/[^A-Za-z0-9-.,:;()]/gi, ''))
    if (!introPlayed)
        afterIntro();
    updateUI(true);
    if (!MOBILE_VERSION && globalDB[selected] && globalDB[selected].og_image != true) {
        TweenMax.killDelayedCallsTo(screenshot);
        TweenMax.delayedCall(1, screenshot, ["thumbnail"]);
    }
    selectedZoom = ZOOM_IN;
}

function showGrid(user) {
    if (!introPlayed)
        afterIntro();

    if (featured)
        updateLocation('featured');
    else if (user)
        updateLocation(user);
    else
        updateLocation(globalDB[0].username);

    selected = -1;
    updateUI(false);
}

function showPrev() {
    if (selected != -1) {
        selected--;
        if (selected < 0) {
            selected = globalDB.length - 1;
        }
        prepare(id);
    }
}

function showNext() {
    if (selected != -1) {
        selected++;
        if (selected >= globalDB.length) {
            selected = 0;
        }
        prepare(id);
    }
}

function setupUI() {
    $('html')
            .toggleClass('mobile', window.mobilecheck())
            .toggleClass('desktop', !window.mobilecheck());

    var langaguesArray = [];
    var languagesHTML = "";
    for (var i = 1; i < TYPES.length; i++) {
        var multiple = TYPES[i].split(',');
        for (var j = 0; j < multiple.length; j++)
            langaguesArray.push(multiple[j]);
    }
    langaguesArray.sort();
    for (var k = 0; k < langaguesArray.length; k++)
        languagesHTML += '<li class="language" data-language="' + langaguesArray[k] + '"><span>' + langaguesArray[k] + '</span></li>';
    languagesHTML = languagesHTML.substr(0, languagesHTML.length - 2);
    $('.language-list').html(languagesHTML);
}


function updateBreadcrumbs(main) {
    //console.log(main, selected);
    var html = '';
    if (!loading && globalDB && globalDB.length > 0 && (selected >= 0 || !featured) && introPlayed) {
        var db = globalDB[Math.max(selected, 0)];
        html += '<li class="breadcrumbs__item">' + db.username + '<a href="#" data-user="featured" class="button js-reset"><i class="icon-reset"></i></a></li>';
        if (selected >= 0 && (!!main || typeof main === 'undefined')) {
            html += '<li class="breadcrumbs__item">' + db.project.substr(0, 50) + '<a href="#" data-user="' + db.username + '" class="button is-project js-reset"><i class="icon-reset"></i></a></li>';
        }
    }

    $('.breadcrumbs')
            .html(html)
            .find('.js-reset').on('click', function (e) {
        e.preventDefault();
        var user = $(e.currentTarget).data('user');
        if (user == 'featured' || (user !== 'featured' && !!featured)) {
            preload(user);
            $('.js-search').val("Find a GitHub user");
        }
        else if (user !== 'featured') {
            $(".js-search").val(user);
        }
        showGrid(user);
        return false;
    });
}


function scrollToTop() {
    var temp = {"val": topGlobal};
    TweenMax.to(temp, 0.7, {val: 0, ease: Power2.easeOut, onUpdate: function () {
            topGlobal = temp.val;
        }});
}


function scrollTo(selectedNum) {
    var temp = {"val": topGlobal};
    TweenMax.to(temp, 0.7, {val: -headerHeight / (windowHeight + windowHeight) + Math.floor(selectedNum / 3) / 2 - 0.25, ease: Power2.easeOut, onUpdate: function () {
            topGlobal = temp.val;
        }});
}

function updateUI(main) {
    updateInfo(main, selected);
    bindUI();
    if (selected == -1) {
        $('#descmain').fadeOut(500);
        for (var i = 0; i < viewsNum; i++) {
            $('#desc' + i).show();
        }
        $('.grid').fadeOut(500);
    } else {
        $('#descmain').fadeIn(500);
        for (var j = 0; j < viewsNum; j++) {
            $('#desc' + j).hide();
        }
        $('.grid').fadeIn(500);
    }
    updateBreadcrumbs(main);
    updateHeaderLinks();
}


function updateHeaderLinks() {

    $('.js-header-links').show();

    var windowWidth = $(window).width(),
            leftWidth = $('.header__left').outerWidth(),
            rightWidth = $('.header__right').outerWidth();

    if (windowWidth - leftWidth < rightWidth)
        $('.js-header-links').hide();
}


function prevSuggestion() {
    var activeEl = $(document.activeElement);
    if (activeEl.parent().is('.search__item')) {
        if (activeEl.parent().prev().length < 1) {
            activeEl.parent().parent().siblings('.js-search').focus();
        } else {
            activeEl.parent().prev().find('a').focus();
        }
    }
}

function nextSuggestion() {
    var activeEl = $(document.activeElement);
    if (activeEl.is('input.js-search')) {
        activeEl.siblings('.js-search-list').find('a').eq(0).focus();
    } else if (activeEl.parent().is('.search__item')) {
        activeEl.parent().next().find('a').focus();
    }
}


var $typewriterEl;
function animatePopupText(id) {

    if ($typewriterEl && $typewriterEl[0])
        $typewriterEl.remove();

    var target = $('#' + id),
            typedSrc = target.find('.typed').css('position', 'relative').children();

    if (!typedSrc[0])
        return;

    $typewriterEl = $('<p class="typed-main">');

    typedSrc
            .css('visibility', 'hidden')
            .after($typewriterEl);

    $typewriterEl.empty().css({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        marginTop: 0
    }).typed({
        strings: [$.trim(typedSrc.html())],
        loop: false,
        showCursor: false,
        startDelay: 0,
        typeSpeed: 0.0001
    });
}