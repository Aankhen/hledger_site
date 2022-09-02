// hs.graphicsDir = '../js/highslide/graphics/';
// hs.outlineType = 'outer-glow';

$(document).ready( function() {
  sidebarHideAllPages();
  addDocVersions();
  highlightCurrentDocVersion();
});

function sidebarHideAllPages() {
  $('#sidebar li:contains("ALL PAGES") ~ li, #sidebar li:contains("ALL PAGES")').hide();  // XXX requires jquery..
}

var currentrelease = '1.27';

function addDocVersions() {
  var parts = window.location.pathname.split('/');
  var page = parts.length > 0 ? parts[parts.length-1].slice(0,-5) : '';
  var hash = window.location.hash.slice(1);
  // Before 1.21 there was 7 manual pages, after 1.21 there are 3.
  // Link from pre-1.21 pages to post-1.21 hashes and vice versa.
  var pre121pages   = ['csv',       'journal',       'timeclock',       'timedot'       ];
  var post121hashes = ['csv-format','journal-format','timeclock-format','timedot-format'];
  var post121hashidx = post121hashes.indexOf(hash);
  var newdest7 = (post121hashidx > -1 ? pre121pages[post121hashidx] : page) + '.html';
  var newdest3 = (pre121pages.indexOf(page) > -1 ? 'hledger.html#' + page + '-format' : (page + '.html'));
  var docversions = document.getElementsByClassName('docversions')[0];
  if (docversions)
    // include just packaged versions to save space (keep synced with site/Makefile)
    docversions.innerHTML = '\
      <a href="/dev/' +newdest3+'">dev</a>  · \
      <a href="/1.27/'+newdest3+'">1.27</a> · \
      <a href="/1.26/'+newdest3+'">1.26</a> · \
      <a href="/1.25/'+newdest3+'">1.25</a> · \
      <a href="/1.24/'+newdest3+'">1.24</a> · \
      <a href="/1.23/'+newdest3+'">1.23</a> · \
      <a href="/1.22/'+newdest3+'">1.22</a> · \
      <a href="/1.21/'+newdest3+'">1.21</a> · \
      <a href="/1.19/'+newdest7+'">1.19</a> · \
      <a href="/1.18/'+newdest7+'">1.18</a> · \
      <a href="/1.12/'+newdest7+'">1.12</a> · \
      <a href="/1.10/'+newdest7+'">1.10</a> · \
      <a href="/1.9/' +newdest7+'">1.9</a>  · \
      <a href="/1.2/' +newdest7+'">1.2</a>  · \
      <a href="/1.0/' +newdest7+'">1.0</a>    \
    ';
}

function highlightCurrentDocVersion() {
  $('.docversions').each( function() {
    var parts = window.location.pathname.split('/');
    var dir = parts.length > 1 ? parts[parts.length-2] : '';
    var ver = $.isNumeric(dir) ? dir : (dir ? "dev" : currentrelease);
    $(this).find('a').each( function() {
      if ($(this).html() == ver)
        $(this).addClass('displayed');
    });
  });
}
