import $ from 'jquery'
export default function isScrolledIntoView(elem)
{
    if(!$(elem) || !$(elem).offset())return false

    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}