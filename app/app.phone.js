define([
  'spot.phone',
  'joshlib!factorycollection',
  'joshlib!ui/list',
  'ui/imagegallery',
  'joshlib!ui/item',
  'joshlib!ui/imageloader',
  'joshlib!router',
  'joshlib!ui/cardpanel',
  'joshlib!ui/slidepanel',
  'ui/text',
  'ui/map',
  'joshlib!utils/onready',
  'joshlib!collection',
  'joshlib!utils/dollar',
  'joshlib!vendor/backbone'],
function(Spot, FactoryCollection, List, ImageGallery, Item, ImageLoader, Router, CardPanel, SlidePanel, Text, Map, onReady, Collection,$,_) {

  document.title = Joshfire.factory.config.app.name;

  onReady(function() {

    Spot.initialize();

    //
    // Toolbar
    //

    var sectionNames = ['photos', 'videos', 'contact', 'events', 'news', 'statuses'];

    var sections = new Backbone.Collection();

    for(var i = 0; i < sectionNames.length; i++) {
      name = sectionNames[i];

      if(Spot.collections[name] || name == 'contact') {
        sections.add({name: name, linkURL: '#' + name});
      }

      //if(i % 5 === 3 && i + 2 < sectionNames.length) {
      //  sections.add({name: 'more', linkURL: 'javascript:function() {return false;}' + name});
      //}
    }

    var toolbar = new List({
      el: 'footer',
      templateEl: '#toolbar',
      itemTemplateEl: '#toolbar-item',
      scroller: true,
      scrollOptions: {
        vScroll: false,
        hScrollbar: false,
        snap: true,
        bounce: false
      }
    });

    toolbar.enhance = function() {
      List.prototype.enhance.call(toolbar);

      var resize = function() {
        if(!this.collection) return;

        var width = window.innerWidth;
        var n = Math.min(5, this.collection.length);
        var itemWidth = (width - 5) / n;

        this.$('> ul').width(itemWidth * this.collection.length + 5);

        this.$('li').css({
          width: itemWidth - 5,
          paddingLeft: 5
        });
      }

      resize.call(this);

      window.addEventListener('resize', function() {resize.call(toolbar);});
    };

    toolbar.setCollection(sections, true);

    //
    // Views
    //
    var views = {};

    // Photos
    views.photos = new ImageGallery({
      el: '#photos-content',
      templateEl: '#item-list',
      scroller: true,
      itemFactory: Spot.itemFactory,
      collection: Spot.collections.photos
    });

    // Statuses
    var statusesViews = {};

    statusesViews.list = new List({
      el: '#statuses-content',
      templateEl: '#item-list',
      contentSelector: '> div:first-child',
      scroller: true,
      itemFactory: Spot.itemFactory,
      collection: Spot.collections.statuses
    });

    statusesViews.detail = new Item({
      el: '#status-detail',
      templateEl: '#template-status',
      scroller: true
    });

    var statusesCards = new SlidePanel({
      el: '#statuses-cards',
      children: statusesViews
    });

    views.statuses = statusesCards;

    // Events
    var eventsViews = {};

    eventsViews.list = new List({
      el: '#events-content',
      templateEl: '#item-list',
      contentSelector: '> div:first-child',
      scroller: true,
      itemFactory: Spot.itemFactory,
      collection: Spot.collections.events
    });

    eventsViews.detail = new Item({
      el: '#event-detail',
      templateEl: '#template-event',
      scroller: true
    });

    var eventsCards = new SlidePanel({
      el: '#events-cards',
      children: eventsViews
    });

    views.events = eventsCards;

    // Videos
    var videosViews = {};

    videosViews.list = new List({
      el: '#videos-content',
      templateEl: '#item-list',
      contentSelector: '> div:first-child',
      scroller: true,
      itemFactory: Spot.itemFactory,
      collection: Spot.collections.videos
    });

    videosViews.detail = new ImageLoader({
      el: '#video-detail',
      templateEl: '#template-video',
      scroller: true,
      getImageUrl: function() {
        return Spot.getVideoThumbnail(this.model.toJSON());
      }
    });

    var videosCards = new SlidePanel({
      el: '#videos-cards',
      children: videosViews
    });

    views.videos = videosCards;

    // News
    var newsViews = {};

    newsViews.list = new List({
      el: '#news-content',
      templateEl: '#item-list',
      contentSelector: '> div:first-child',
      scroller: true,
      itemFactory: Spot.itemFactory,
      collection: Spot.collections.news
    });

    newsViews.detail = new Item({
      el: '#news-detail',
      templateEl: '#template-news',
      scroller: true
    });

    var newsCards = new SlidePanel({
      el: '#news-cards',
      children: newsViews
    });

    views.news = newsCards;

    // Contact
    var contactViews = {};

    contactViews.index = new Text({
      el: '#contact-index',
      templateEl: '#template-contact-index',
      textContent: Spot.contactHTML,
      scroller: true
    });

    contactViews.map = new Map({
      el: '#contact-map',
      templateEl: '#template-contact-map',
      latitude: Spot.latitude,
      longitude: Spot.longitude,
      icon: 'images/phone-location.png',
      overlayTemplateEl: '#template-map-overlay',
      overlayOptions: { address: Spot.address }
    });

    var contactCards = new SlidePanel({
      el: '#contact-cards',
      children: contactViews
    });

    views.contact = contactCards;


    // Main panel
    var cards = new CardPanel({
      el: '#cards',
      children: views
    });

    //
    // Router
    //
    var $title = $('#title');
    var $back = $('#back');
    var $refresh = $('#refresh');
    var $footer = $('footer');

    // Create a view for a list
    var makeRouteForList = function(name, sectionCards) {
      return function() {
        $title.text(Joshfire.factory.getDataSource(name).name);
        $footer.find('.active').removeClass('active');
        $footer.find('.' + name).addClass('active');
        cards.showChildren(name);

        if(sectionCards) sectionCards.showChildren('list');

        document.body.id = name;
        $back.hide();
        $refresh.show().unbind('click').click(function() {
          Spot.collections[name].fetch();
          return false;
        });

        if(Spot.collections[name].length === 0) {
          Spot.collections[name].fetch();
        }
      };
    };

    // Create a view for an item detail
    var makeRouteForItemDetail = function(name, sectionCards, plural) {
      plural = plural || name + 's';

      return function(offset) {
        $title.text(Joshfire.factory.getDataSource(plural).name);
        $footer.find('.active').removeClass('active');
        $footer.find('.' + plural).addClass('active');
        cards.showChildren(plural);
        sectionCards.showChildren('detail');
        document.body.id = name;
        $back.attr('href', '#' + plural + '').show();
        $refresh.hide();

        if(Spot.collections[plural].length === 0) {
          Spot.collections[plural].fetch({success: function() {
            var model = Spot.collections[plural].at(parseInt(offset));
            sectionCards.children.detail.setModel(model, true);
          }});
        } else {
          var model = Spot.collections[plural].at(parseInt(offset));
          sectionCards.children.detail.setModel(model, true);
         }
      }
    };

    var router = Router({
      routes: {
        '':                   sections.at(0).get('name'),
        'photos':             'photos',
        'statuses':           'statuses',
        'videos':             'videos',
        'events':             'events',
        'news':               'news',
        'contact':            'contact',
        'map':                'map',

        'status/:offset':     'status',
        'video/:offset':      'video',
        'event/:offset':      'event',
        'article/:offset':    'article'
      },

      // List routes
      photos:   makeRouteForList('photos'),
      statuses: makeRouteForList('statuses', statusesCards),
      videos:   makeRouteForList('videos', videosCards),
      events:   makeRouteForList('events', eventsCards),
      news:     makeRouteForList('news', newsCards),

      // Detail routes
      status:   makeRouteForItemDetail('status', statusesCards, 'statuses'),
      video:    makeRouteForItemDetail('video', videosCards),
      event:    makeRouteForItemDetail('event', eventsCards),
      article:  makeRouteForItemDetail('article', newsCards, 'news'),

      // Contact
      contact: function() {
        $title.text('Contact');
        document.body.id = 'contact';
        $footer.find('.active').removeClass('active');
        $footer.find('.contact').addClass('active');
        cards.showChildren('contact');
        contactCards.showChildren('index');
        $back.hide();
        $refresh.hide();
        contactViews.index.render();
      },

      // Map
      map: function() {
        $title.text('Map');
        document.body.id = 'map';
        $footer.find('.active').removeClass('active');
        $footer.find('.contact').addClass('active');
        cards.showChildren('contact');
        contactCards.showChildren('map');
        $back.attr('href', '#contact' + '').show();
        $refresh.hide();
        contactViews.map.render();
      }

    });

    router.historyStart();
  });
});