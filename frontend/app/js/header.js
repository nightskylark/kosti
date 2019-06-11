function initHeaderFunctions(){
	var activeEl = $('.nav-list .active').length > 0 ? $('.nav-list .active') : $(".header-logo a");
	$('.active_element').css('left', activeEl.position().left - 3 + activeEl.width() / 2);
	$('.nav-list .nav-item a').on('mouseenter', function(){
		$('.active_element').css('left', $(this).position().left - 3 + $(this).width() / 2);
	});
	$('.nav-list .nav-item a').on('mouseleave', function(){
		$('.active_element').css('left', activeEl.position().left - 3 + activeEl.width() / 2);
	});
	$(document).on('scroll', function(){
		if ( $(document).scrollTop() > 85 ){
			if ($('body').hasClass('homepage') || $('body').hasClass('article-page') || $('body').hasClass('announce-page')){
				$('.header').addClass('header-scroll');
			}
			if(!$('.header').hasClass('change-logo')){
				$('.header').addClass('change-logo');
				setTimeout(function() {
					$('.active_element').css('left', activeEl.position().left - 3 + activeEl.width() / 2);
				}, 100);
			}
		}
		else {
			if($('.header').hasClass('change-logo')){
				$('.header').removeClass('header-scroll change-logo');
				setTimeout(function() {
					$('.active_element').css('left', activeEl.position().left - 3 + activeEl.width() / 2);
				}, 100);
			}
		}
	});
}