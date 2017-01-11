/**
 * Created by ziyu on 2017/1/4.
 */


(function($){


	$(document).ready(function(){
//			window.onload
//			console.log($);

		$('.J_test  span').click(function (e) {
			var t = $(this).text();
			console.log(t);
//				var ele = $('.J_test').find('span')[0]; // document 对象
//				var ele = document.getElementsByClassName('J_test')[0].getElementsByTagName('span')[0]
			var ele = $('.J_test').find('span:first'); //jquery 对象
			console.log(ele);
//				$(ele).hide();
			$(ele).toggle();
//				ele.toggle();

		});

	});
})(jQuery)