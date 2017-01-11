/**
 * Created by ziyu on 2017/1/11.
 */

$(function(){

	$('.J_btn').on('click',function () {

		get_ajax01(function (res) {
			console.log(res);
			var _str = res.data.dd;
			if (_str){
				get_ajax02(_str);
			}
		});

	});
	//先请求第一个接口,用第一个接口返回的数据当做参数回调第二个函数,请求第二个接口.
	function get_ajax01(cb){
		$.ajax({
			url:"./ajax_01.json",
			type: 'get',
			dataType:'json'
		}).success(function (res) {
			if (cb){
				cb(res);
			}

		})
	}

	function get_ajax02(str){
		if (!str){
			console.log('参数不能为空');
			return false;
		}
		$.ajax({
			url:'./ajax_02.json?type=' + str ,
			// type:'get',
			type:'post',
			data:{
				arg: str,
				time: $.now()
			},
			dataType: 'json'
		}).success(function (data) {
			$('.J_test').html(str);

			if (data.data.dd){
				var ele = $('<div></div>');
				$(ele).text(data.data.dd).css({
					border:'1px solid green',
					padding: '10px'
				});

				$('body').append(ele);

				var _ul = $('<ul></ul>');
				var _li = '';
				if (data.data.list.length){
					data.data.list.forEach(function(current,index){
						_li += '<li>' + current + '</li>';
					});
				}
				_ul.append(_li);
				$('body').append(_ul);

			}

		}).error(function () {
			console.log('系统错误');
		}).complete(function () {
			console.log('操作结束');
			$('body').find('li').css({
				background:'green',
				color:'#fff'
			});
		})
	}

});