/**
 * Created by ziyu - Think on 2015/10/21.
 */
(function($){
	var IMAPP= {
		getUserInfos:'/user/getBatchIMUserInfo'//获取用户nick,icon信息
	};
	var PCIM = {
		init:function(){
			var self = this;
			self.isTest = (location.host.indexOf('www.xiangqutest.com') > -1) ? true : false;
			self.J_callIMBtn = $('.J_callIm');//呼起im
			self.J_imBox = $('.J_imBox');//im窗口
			self.J_imPicUploadBtn = self.J_imBox.find('.J_imPicUpload');//上传图片
			self.J_imMsgBox = self.J_imBox.find('.J_imMsgBox');//消息墙

			self.appId = self.isTest ? 'rqgHyIT864XDxNo1cmorb5VP' : 'pq7rCFbDcdATMLnDKKNzCqU4';//appId
			self.appKey = self.isTest ? 'YxMYQPhL2VMopYcHTahdkTc1' : 'kd2LHLbNUn7N2vWbj0XvKR9m';
			self.clinetId = XIANGQU.userId; //客户端ID
			self.realtimeObject = null;//声明实时通信对象,用来存储realtimeObject
			self.room = null;//实时通信的最小单元

			self.userItmes = [];//与当前账户相关的用户列表
			self.isUpLoadPic = false;//是否是在上传图片
			self.firstFlag = true;//监听是否服务器连接成功
			self.logFlag = false;//标记历史消息获取状态
			self.isShowRoom = false;//是否有room,用于判断回车发送信息
			self.isChangeRoom = false;//切换room

			self.fromAvat = '';//会话用户图像
			self.clinetAvat = '';//登录用户的图像

			self.msgTime = '';//拉取历史相关,//最早一条消息的时间戳
			self.msgNum = 0;//消息记数
			self.msgType = 'text'; //发送的信息类型
			self.smallWidth = 60;
			self.smallHeight = 60;
			self.sendIsable = true;//默认可以发送

			self.brows = XQTOOL.browsers();//{msie: true, version: "8.0"}

			if(!self.brows && !(self.brows.version <= 8)){
				AV.initialize(self.appId,self.appKey);
				self.eventHanding();
				XQTOOL.filterWords.init();
			}


		},
		eventHanding:function(){
			var self = this;

			if(XIANGQU.userId){
				self.initPCIM();
				$('.J_siderEwm').css('bottom','57px');
				$('.feedback').css('bottom','292px');
				self.J_callIMBtn.show();
				self.getClintIcon();
			}else{
				self.J_callIMBtn.hide();
			}

			//上传发送的图片

			self.J_imPicUploadBtn.on('change',function(e){

				var fileUploadControl = self.J_imPicUploadBtn.find('#J_imPicFile')[0];

				self.J_imBox.find('.J_picLoading').show();
				self.J_imBox.find('.J_picUpload').hide();

				if (fileUploadControl.files.length > 0) {
					var file = fileUploadControl.files[0];
					var name = file.name;
					if(Number(file.size/1024/1024).toFixed(2) > 1){
						alert('请选择1M以内的图片！');
						return false;
					}
					var pos = name.lastIndexOf('.');
					var typeName = name.substring(pos + 1,name.length);

					if(typeName.toLowerCase() != 'jpg' && typeName.toLowerCase() != 'gif' && typeName.toLowerCase() != 'png'){
						alert('上传图片类型必须为jpg,gif,png类型');
						return false;
					}

					self.isUpLoadPic = true;
					if(self.isUpLoadPic == false){
						return false;
					}
					var avFile = new AV.File(name, file);
					//console.log(file);
					self.J_imBox.find('.J_imPicUploadBox').show();
					if(self.isUpLoadPic == false){
						return false;
					}
					avFile.save({
						success:function(data){
							if(self.isUpLoadPic == false){
								return false;
							}
							if(data){
								var url = data.thumbnailURL(self.smallWidth,self.smallHeight);
								//console.log(data);
								self.isLoadImg(url,function(){
									// console.log('加载完成');
									// console.log(url);
									data.size = file.size;
									self.J_imBox.find('.J_imPicUploadBox .J_picUpload').attr({
										'src':url,
										'data-id':data.id,
										'data-src':data._url
									}).data('data',data);
									var _height = self.J_imBox.find('.J_picUpload').height();
									self.J_imBox.find('.J_picUpload').css({
										marginTop: (80-_height)/2
									})
									self.J_imBox.find('.J_picLoading').hide();
									self.J_imBox.find('.J_picUpload').show();
									self.J_imBox.find('.J_imPicUploadBox').show();
									self.J_imBox.find('.J_imInput').val('发送图片').focus();
									self.msgType = 'image';
								});

							}
						},
						error:function(error){
							alert('上传失败！请重新上传');
						}
					});


				}
			});


			//机动唤起实时通信窗口
			/*$(document).on('click','.J_RandomCallIM',function(e){
			 e.preventDefault();
			 self.initRoom();
			 })*/

			$(document).on('click','.J_RandomCallIm',function(e){
				e.preventDefault();

				if(!XIANGQU.userId){
					XQTOOL.loginBox();
					return false;
				}
				if(self.isShowRoom){
					//有window时，
					return false;
				}else{
					//无window时

					self.msgTime = '';
					self.isChangeRoom = true;
					self.renderRoomDetail();
				}

			});

			//唤起实时通信窗口
			self.J_callIMBtn.on('click',function(e){
				e.preventDefault();
				//self.J_imMsgBox.empty();

				var _optionUser = {
					userId:$(this).attr('data-frompeerid'),
					roomId:$(this).attr('data-roomid'),
					time:$(this).attr('data-time')

				}
				self.msgTime = '';
				self.isChangeRoom = true;
				self.renderRoomDetail(_optionUser);

				self.J_callIMBtn.attr({
					'data-roomid':'',
					'data-fromPeerid':'',
					'data-time':''
				}).find('.have-msg').hide()
				.siblings('p').show();
				self.msgNum = 0;
			});

			//关闭异常提示
			self.J_imBox.on('click',function(){
				$('.J_timeout_close').hide();
			});
			//关闭实时通信窗口

			self.J_imBox.on('click','.J_closeIm',function(e){
				e.preventDefault();
				self.J_imMsgBox.find('.im-msg-items').empty();
				self.J_imBox.find('.J_userItems ul').empty();
				self.J_imBox.find('.J_imInput').removeAttr('disabled');
				self.J_imBox.find('.J_imPicFile').removeAttr('disabled','disabled');
				self.J_imBox.find('.J_imSendBtn').removeClass('disabled');
				self.J_imBox.hide();
				self.isShowRoom = false;
				self.room = null;
				self.msgTime = '';
				self.sendIsable = true;
				$('body').find('.J_RandomCallIm').removeClass('im-disable');
			});

			//取消图片发送
			self.J_imBox.on('click','.J_closeSendPic',function(e){
				e.preventDefault();
				self.isUpLoadPic = false;
				$(this).closest('.J_imPicUploadBox').removeAttr('style');
				self.J_imBox.find('#J_imPicFile').val("");
				self.msgType = 'text';
				self.J_imBox.find('.J_imInput').val('').focus();
			});
			//切换聊天对象
			self.J_imBox.on('click','.J_userItem',function(e){
				e.preventDefault();

				self.sendIsable = true;
				self.J_imBox.find('.J_userItem').removeClass('active');
				$(this).addClass('active').removeClass('haveMsg').closest('li').siblings('li').find('.J_userItem').removeClass('active');
				$(this).addClass('active').removeClass('haveMsg');
				$(this).find('.msg-new').html('');


				self.msgTime = '';
				self.isChangeRoom = true;
				var html;
				if(location.href.indexOf('product/detail') > -1){
					var _productInfo = {
						productUserId:XIANGQU.productUserId,
						productId: XIANGQU.productId,
						productTitle: XIANGQU.productTitle,
						productImg:XIANGQU.productImg,
						productPrice:XIANGQU.productPrice,
						productUrl:location.href
					};

					html = template('J_tempDetailInfo',_productInfo);
				}

				if($(this).attr('data-nickid') == XIANGQU.productUserId){
					if($(this).attr('data-roomid')){
						self.renderRoomWindow(html);
					}else{
						self.renderRoomWindow(html,true);
					}
				}else{
					self.renderRoomWindow();
				}


			});

			//发送消息
			self.J_imBox.on('click','.J_imSendBtn',function(e){
				e.preventDefault();
				if($(this).hasClass('disabled')){
					return false;
				}
				self.sendMsgData();
			});
			//发送商品详情
			self.J_imBox.on('click','.J_sendDetailInfo',function(e){
				e.preventDefault();
				var that = this;
				self.msgType = 'textImg';

				var J_imDetailCont = $(that).closest('.J_imdetailInfoBox');

				var _data = {
					_lctype:1,
					_lcattrs:{
						productId:J_imDetailCont.find('.detail-img img').attr('data-productId'),
						productImgUrl:J_imDetailCont.find('.detail-img img').attr('src'),
						productPrice:J_imDetailCont.find('.price').attr('data-price'),
						productTitle:J_imDetailCont.find('h6 a').html()
					}

				}
				self.sendMsgData(_data);
			});
			self.J_imBox.on('keyup','.J_imInput',function(e){
				e.preventDefault();

				if(e.keyCode == 13){
					if(self.firstFlag){
						alert('通话超时，请刷新或重新登录后再操作')
						return false;
					}else{
						if(self.isShowRoom){
							if($(this).siblings('.J_imSendBtn').hasClass('disabled')){
								return false;
							}
							self.sendMsgData();
						}
					}
				}


			});

			//拉取历史
			self.J_imMsgBox.on('click','.J_msgViewMore span',function(e){
				e.preventDefault();

				var roomId = self.J_imBox.find('.J_userItem[class*=active]').attr('data-roomid');
				var _offsetTop = self.J_imMsgBox.find('.im-msg-items').height();

				self.getHistoryLog(roomId,function(){
					var height = self.J_imMsgBox.find('.im-msg-items').height();
					self.J_imMsgBox.scrollTop(Math.abs(height-_offsetTop) - 200);
					//console.log(self.formatTime(self.msgTime));
					//console.log(self.msgTime);

				});

			});

		},
		initPCIM:function(){
			var self = this;
			//初始化即时通信,建立长链接，查询所在房间

			self.realtimeObject = AV.realtime({
				appId:self.appId,
				clientId:self.clinetId,
				secure:false,
				encodeHTML:true,
				auth:authFun
			});

			self.realtimeObject.on('open',function(){

				self.firstFlag = false;

			});

			self.realtimeObject.on('error',function(e){
				//console.log(e);
			});
			//当前用户所在的组，有消息时触发
			self.realtimeObject.on('message',function(data){
				//登录异常关闭
				$('.J_timeout_close').hide();

				// console.log('消息触发：' );
				//console.log(data);
				//{cid:'roomId',,fromPeerId:'689',peerId:'41',timestamp:'',msg{text:'dd'}}
				//console.log(data);
				if(self.isShowRoom){
					//console.log(1);
					//console.log('同一room');
					if(data.cid == self.J_imBox.find(".J_userItem[class*=active]").attr('data-roomid')){
						//当前的Room
						if(data.msg.type == 'text'){
							data.msg.text = self.regexpURL(data.msg.text);
						}
						self.showHistoryLog(data,false);
					}
					else{
						//更新用户列表
						//console.log('不在当前Room中,更新用户列表');
						var currTag = self.J_imBox.find('.J_userItem[data-roomId*='+ data.cid +']');
						if(currTag.length){
							//有过历史会话时，标识为有消息
							var _num = Number(currTag.find('.msg-new').html()) + 1;
							currTag.find('.msg-new').html(_num);
							if(currTag.attr('data-timestamp') == undefined){
								currTag.attr('data-timestamp',data.timestamp);
							}
							currTag.addClass('haveMsg');
						}else{
							//没有历史会话时，在联系人列表后加入新成员
							self.userItmes=[];
							var _objUser = {
								userId:data.fromPeerId,
								roomId:data.cid
							}
							self.userItmes.push(_objUser);

							self.getUserNickIcon(data.fromPeerId,function(rs){

								var users = rs;
								for(var i = 0; i < users.length; i++){
									for(var j = 0; j < self.userItmes.length; j ++){
										if(users[i].id == self.userItmes[j].userId){
											self.userItmes[j].nick = users[i].nick;
											self.userItmes[j].avatarPath = users[i].avatarPath;

										}
									}
								}

								var _userItemsInfo = {
									_data:self.userItmes
								};
								var _userItemHtml = template('J_tempImUserItem',_userItemsInfo);
								self.J_imBox.find('.J_userItems ul').prepend(_userItemHtml);
								var _newImUser = self.J_imBox.find('.J_userItem[data-roomId*='+ data.cid +']');
								if(_newImUser.length){
									var _num = Number(_newImUser.find('.msg-new').html()) + 1;
									_newImUser.find('.msg-new').html(_num);
									_newImUser.attr('data-timestamp',data.timestamp);
									_newImUser.addClass('haveMsg');
									_newImUser.removeClass('active');
								}
							});
						}
					}

				}
				else{

					if(data.fromPeerId == self.clinetId){
						return false;
					}
					var _newMsgItem = {
						cid:data.cid,
						fromPeerId:data.fromPeerId,
						num:1
					};

					var _newMsgHtml = template('J_tempNewMsgItem',_newMsgItem);
					self.J_imBox.find('.J_newMsgs').append(_newMsgHtml);

					self.msgNum ++;
					self.J_callIMBtn.attr({
						'data-roomid':data.cid,
						'data-fromPeerid':data.fromPeerId,
						'data-time': data.timestamp
					}).find('.have-msg span').html('您有' + self.msgNum +'条未读消息')
					.closest('p').show()
					.siblings('p').hide();
				}

			});

			//self.realtimeObject.on('membersjoined',function(data){
			//    //监听所有用户加入的情况
			//    console.log('有用户加入某个当前用户在的 room:');
			//    console.log(data);
			//});
			//
			self.realtimeObject.on('close',function(){
				//alert('登录超时，请尝试重新登录！')
				$('.J_timeout_close p').html('登录超时，请尝试重新登录！');
				$('.J_timeout_close').show();


			});

			self.realtimeObject.on('reuse',function(rs){
				//alert('网络状况不佳，正在重新连接...');
				$('.J_timeout_close p').html('网络状况不佳，正在重新连接...');
				$('.J_timeout_close').show();

			});


			function authFun(options,callBack){

				$.ajax({
					url:'/leancloud/sign',
					data:{
						clientId:options.clientId,
						memberJson:(function(){
							if(location.href.indexOf('product/detail') < 0){
								return '';
							}else{
								var _number = options.members;
								var _objArr = [];
								if(_number){
									for(var i = 0; i < _number.length; i++){
										_objArr.push({
											'userId':_number[i]
										});
									}
								}
								return JSON.stringify(_objArr);
							}

						})(),
						action:'',
						convId:''
					},
					type:'post',
					dataType:'json',
					success:function(rs){
						if(rs.data.alter){

							alert(rs.data.alter);
						}
						callBack(rs.data);
					}
				});
			}

		},
		returnCurrMsgNum:function(cid){
			var self = this;
			//返回当前没读消息数
			var _num = 0;
			var _cidItem = '';
			if(cid){
				_cidItem = self.J_imBox.find('.J_newMsgs span[data-cid*="'+ cid +'"]').length;
				_num = _cidItem;
			}

			return _num;
		},
		MsgTimeDiff:function(preTime,nextTime){
			var self = this;
			//返回时间差，为5分钟
			preTime = preTime || $.now();
			nextTime = nextTime || $.now();
			if(typeof preTime == 'string'){
				preTime = new Date(preTime);
				preTime = preTime.getTime();
			}
			if(typeof nextTime == 'string'){
				nextTime = new Date(nextTime);
				nextTime = nextTime.getTime();
			}
			var diffVal = Math.abs(nextTime - preTime);

			//计算出相关的天数
			var days = Math.floor(diffVal/(24*3600*1000));
			//计算出小时数
			var leave1 = diffVal%(24*3600*1000);
			var hours = Math.floor(leave1/(3600*1000));
			//计算相差分钟数
			var leave2 = leave1%(3600*1000);
			var minutes = Math.floor(leave2/(60*1000));

			//相差秒数
			var leave3 = leave2%(60*1000);
			var seconds = Math.floor(leave3/1000);


			//console.log(minutes);
			return minutes;


		},
		getUserNickIcon:function(strs,callBack){
			var self = this;
			if(strs){
				$.ajax({
					url:IMAPP.getUserInfos,
					type:'post',
					data:{
						userIds:strs
					},
					dataType:'json',
					success:function(rs){
						if(rs.code != 200){
							return false;
						}

						if(rs.data.length){
							//var users = rs.data;
							//for(var i = 0; i < users.length; i++){
							//    for(var j = 0; j < self.userItmes.length; j ++){
							//        if(users[i].id == self.userItmes[j].userId){
							//            self.userItmes[j].nick = users[i].nick;
							//            self.userItmes[j].avatarPath = users[i].avatarPath;
							//
							//        }
							//    }
							//}

							if(callBack){
								callBack(rs.data);
							}

						}
					}
				})
			}
		},
		returnAvaUrl:function(url){
			var self = this;
			if(!url){
				throw "无效的值";
				return false;
			}
			var _url = url,
				_urlIndex = _url.indexOf('?'),
				_objUrl = _url.substring(0,_urlIndex);
			return _objUrl;

		},
		getClintIcon:function(str){
			var self = this;
			//返回当前登录的Icon
			str = str || self.clinetId;
			$.ajax({
				url:IMAPP.getUserInfos,
				type:'post',
				data:{
					userIds:str
				},
				dataType:'json',
				success:function(rs) {
					if (rs.code != 200) {
						return false;
					}
					if(rs.data.length) {
						var users = rs.data;
						self.clinetAvat =  self.returnSmallImg(self.returnAvaUrl(users[0].avatarPath),30,30,70,1);
					}

				}
			});
		},
		getUserInfo:function(strs,callBack){
			var self = this;
			//批量获取头像各用户Id,入参
			if(strs){

				$.ajax({
					url:IMAPP.getUserInfos,
					type:'post',
					data:{
						userIds:strs
					},
					dataType:'json',
					success:function(rs){
						if(rs.code != 200){
							return false;
						}

						if(rs.data.length){
							var users = rs.data;
							for(var i = 0; i < users.length; i++){
								for(var j = 0; j < self.userItmes.length; j ++){
									if(users[i].id == self.userItmes[j].userId){
										self.userItmes[j].nick = users[i].nick;
										self.userItmes[j].avatarPath = self.returnSmallImg(self.returnAvaUrl(users[i].avatarPath),30,30,70,1);
										self.userItmes[j].num =self.returnCurrMsgNum(self.userItmes[j].roomId);
									}
								}
							}

							var _userItemsInfo = {
								_data:self.userItmes
							};

							var _userItemHtml = template('J_tempImUserItem',_userItemsInfo);
							self.J_imBox.find('.J_userItems ul').append(_userItemHtml);
							if(callBack){
								callBack();
							}

						}

					}
				});
			}
		},
		renderRoomWindow:function(html,flag){
			//渲染room窗口内容
			var self = this;
			var _roomId = self.J_imBox.find('.J_userItem[class*="active"]').attr('data-roomId');
			self.fromAvat = self.J_imBox.find('.J_userItem[class*="active"]').find('.user-icon img').attr('src');
			self.J_imBox.find('.J_newMsgs span[data-cid*="'+ _roomId +'"]').remove();
			self.J_imBox.find('.J_userInfo span').html(self.J_imBox.find('.J_userItem[class*="active"]').attr('data-nick'));
			//加入单品详情信息
			self.J_imBox.find('.J_userInfo').attr('data-roomid',_roomId);
			self.J_imMsgBox.find('.im-msg-items').empty();
			self.J_imBox.find('.J_userItem[class*="active"]').find('.msg-new').html('');
			//没有会话记录时，渲染room;
			if(flag){
				if(html){
					self.J_imMsgBox.find('.im-msg-items').append(html);
				}
				self.isChangeRoom = false;
				self.isShowRoom = true;
				self.J_imBox.show();
			}else{
				self.getHistoryLog(_roomId,function(){
					if(html){
						self.J_imMsgBox.find('.im-msg-items').append(html);
					}
					self.isChangeRoom = false;
					self.isShowRoom = true;
					self.J_imBox.show();
					self.J_imMsgBox.scrollTop(self.J_imMsgBox.find('.im-msg-items').height());
				});
			}

		},
		renderRoomDetail:function(option){
			var self = this;
			if(option && option.userId){
				//console.log(option);
				var _newUsers = {
					userId:option.userId,
					roomId: option.roomId
				};
				//有新消息时
				self.getUserItems(self.clinetId,function(){

					if(!self.userItmes.length){
						//当前为新用户，没有与之相关的联系人
						self.userItmes.push(_newUsers);
						var _userId = [];
						for(var i = 0; i < self.userItmes.length; i++){
							_userId.push(self.userItmes[i].userId);
						}
						_userId = _userId.join(',');
						self.getUserInfo(_userId,function(){
							self.renderRoomWindow();
						});
					}else{
						var _delArr = [];
						for(var i = 0; i < self.userItmes.length;i++){
							if(_newUsers.userId == self.userItmes[i].userId && _newUsers.roomId == self.userItmes[i].roomId){
								//与当前productUser 有过会话记录
								_delArr = [];
								_delArr.push(self.userItmes[i]);
								self.userItmes.splice(i,1);
								break;
							}
						}

						if(_delArr.length){
							self.userItmes.unshift(_delArr[0]);
						}else{
							self.userItmes.unshift(_newUsers);
						}

						var _userId = [];
						for(var j = 0; j < self.userItmes.length; j++){
							_userId.push(self.userItmes[j].userId);
						}
						_userId = _userId.join(',');
						self.getUserInfo(_userId,function(){
							self.renderRoomWindow();

						});
					}

					$('body').find('.J_RandomCallIm').addClass('im-disable');

				});

			}else{

				//非新消息时
				if(!(location.href.indexOf('manage/leancloud') > 0 || location.href.indexOf('product/detail') > 0 )){
					//非详情页面，没有新消息时
					self.getUserItems(self.clinetId,function(){
						//用户第一次使用即时通信，没有一个联系人时
						if(!self.userItmes.length){
							self.NoOnlyRoom();
							return false;
						}

						var _userId = [];
						for(var i = 0; i < self.userItmes.length; i++){
							_userId.push(self.userItmes[i].userId);
						}
						_userId = _userId.join(',');
						//没有与当前会话的联系人时，
						if(!_userId.length){
							self.NoOnlyRoom();
							return false;
						}
						//有会话的联系人,获取会话人的Icon
						self.getUserInfo(_userId,function(){
							self.renderRoomWindow();
						});
					});

				}else{
					//详情页面
					var html = null;
					if (location.href.indexOf('product/detail') > 0){
						var _productInfo = {
							productUserId:XIANGQU.productUserId,
							productId: XIANGQU.productId,
							productTitle: XIANGQU.productTitle,
							productImg:XIANGQU.productImg,
							productPrice:XIANGQU.productPrice,
							productUrl:location.href
						};
						html = template('J_tempDetailInfo',_productInfo);
					}
					self.getUserItems(self.clinetId,function(){

						if(!self.userItmes.length){
							//用户第一次在详情页面使用即时通信
							if(self.clinetId != XIANGQU.productUserId){
								//先获取头像，渲染页面，在发消息时，再创建room
								self.getUserNickIcon(XIANGQU.productUserId,function(rs){
									var users = rs;
									self.userItmes = [];
									for(var i = 0; i < users.length; i++){
										var _item = {
											nick: users[i].nick,
											avatarPath: users[i].avatarPath,
											userId:users[i].id
										};
										self.userItmes.push(_item);

									}

									var _userItemsInfo = {
										_data:self.userItmes
									};
									var _userItemHtml = template('J_tempImUserItem',_userItemsInfo);
									self.J_imBox.find('.J_userItems ul').prepend(_userItemHtml);
									self.renderRoomWindow(html,true);

								});



							}else{
								self.NoOnlyRoom();
								return false;
							}

						}else{
							//老用户登录在详情页面
							var _userId = [];
							for(var i = 0; i < self.userItmes.length; i++){
								_userId.push(self.userItmes[i].userId);
							}
							_userId = _userId.join(',');

							if(_userId.indexOf(XIANGQU.productUserId) > -1){
								//与当前卖家有过历史记录，当前联系人列表第一个即为当前卖家
								var _delArr = [];
								for(var i = 0; i < self.userItmes.length;i++){
									if(XIANGQU.productUserId == self.userItmes[i].userId){
										//与当前productUser 有过会话记录
										_delArr = [];
										_delArr.push(self.userItmes[i]);
										self.userItmes.splice(i,1);
										break;
									}
								}
								if(_delArr.length){
									self.userItmes.unshift(_delArr[0]);
								}
								//console.log(_delArr[0]);
								var _userId = [];
								for(var j = 0; j < self.userItmes.length; j++){
									_userId.push(self.userItmes[j].userId);
								}
								_userId = _userId.join(',');
								self.J_imBox.find('.J_userItems ul').empty();
								self.getUserInfo(_userId,function(){
									//console.log(self.userItmes);
									self.renderRoomWindow(html);
								});
							}else{
								//与当前卖家没有过历史记录，放在联系人列表第一个
								//console.log(1);
								if(self.clinetId == XIANGQU.productUserId){

									//在自己的店铺详情页面
									var _userId = [];
									for(var j = 0; j < self.userItmes.length; j++){
										_userId.push(self.userItmes[j].userId);
									}
									_userId = _userId.join(',');
									self.J_imBox.find('.J_userItems ul').empty();
									self.getUserInfo(_userId,function(){
										//console.log(self.userItmes);
										self.renderRoomWindow();
									});
								}else{
									//无会话记录

									var _userItem = {
										userId: XIANGQU.productUserId,
										roomId:''
									};

									self.userItmes.unshift(_userItem);

									var _userId = [];
									for(var i = 0; i < self.userItmes.length; i++){
										_userId.push(self.userItmes[i].userId);
									}
									_userId = _userId.join(',');
									self.J_imBox.find('.J_userItems ul').empty();
									self.getUserInfo(_userId,function(){
										self.renderRoomWindow(html,true);
									});

								}

							}
						}

						$('body').find('.J_RandomCallIm').addClass('im-disable');

					});



				}

				//========= end ===============================
			}
		},
		NoOnlyRoom:function(){
			var self = this;
			//没有一个room
			self.J_imBox.find('.J_userItems ul').html('<p style="text-align: center;margin-top:20px;">暂时没有联系人</p>');

			var _imMsgWindow = template('J_tempErrorTips');

			self.J_imMsgBox.find('.J_msgViewMore').hide();
			self.J_imMsgBox.find('.im-msg-items').append(_imMsgWindow).find('.J_imerrorTips').html('<p style="text-align: center;">暂时没有联系人的消息记录!</p>');
			self.J_imBox.find('.J_imInput').attr('disabled','disabled');
			self.J_imBox.find('#J_imPicFile').attr('disabled','disabled');
			//self.J_imPicUploadBtn.find('#J_imPicFile').attr('disabled','disabled');
			self.J_imBox.find('.J_imSendBtn').addClass('disabled');
			self.J_imBox.show();

		},
		getUserItems:function(clinetId,callback){
			var self = this;
			//返回与当前用户相关的用户列表
			//[{userId:123,roomId:1122}]
			//self.userItmes.length = 0;
			self.realtimeObject.query({
				where:{
					m: clinetId
				}
			},function(data){


				self.userItmes = [];
				if(data.length){
					self.userItmes = [];
					var roomLen = data.length;
					var _roomItme ={};
					for(var i = 0 ; i < roomLen; i++){
						for(var j = 0; j < data[i].m.length;j++){
							if(data[i].m[j] == self.clinetId || data[i].m[j] == ''){
								continue;
							}
							_roomItme = {
								userId:(function(){
									return data[i].m[j];
								})(),
								roomId:data[i].objectId
							};

							self.userItmes.push(_roomItme);
						}
					}


				}
				if(callback){
					callback();
				}
			});
		},

		getHistoryLog:function(roomId,callBack){
			var self = this;
			//跟据roomId，获取消息历史

			self.realtimeObject.room(roomId,function(data){
				if(data){
					self.room = data;
					if(self.logFlag){
						return ;
					}else{
						//标记正在拉取
						self.logFlag = true;

					}
					self.J_imBox.find('.J_msgViewMore').show();
					self.room.log({
						t:self.msgTime,
						limit:10
					},function(rs){
						self.logFlag = false;
						var l = rs.length;
						if(!self.isChangeRoom){
							rs.reverse();
						}else{
							rs = rs;
						}


						if(l){

							if(self.isChangeRoom){
								self.msgTime = rs[0].timestamp;
							}else{

								self.msgTime = rs[l-1].timestamp;
							}

						}else{
							self.J_imBox.find('.J_msgViewMore').hide();
						}
						for(var i = 0; i < l; i++){
							//console.log(rs[i].msg.text);
							rs[i].msg.text = self.regexpURL(rs[i].msg.text);
							if(self.isShowRoom){
								if(self.isChangeRoom){
									self.showHistoryLog(rs[i],false);
									self.isChangeRoom = true;
								}else{
									self.showHistoryLog(rs[i],true);
								}
							}else{
								self.showHistoryLog(rs[i],false);

							}

						}
						if(l){
							self.J_imMsgBox.scrollTop(self.J_imMsgBox.find('.im-msg-items').height());
						}
						if(callBack){
							callBack();

						}
					});
				}else{
					alert('服务器没有这个room');
				}
			});
		},
		showHistoryLog:function(data,isBefore){
			var self = this;
			//拉取到历史消息，显示在demo中
			var _html= '';
			var _html_pre = '';
			//debugger;
			if(data){


				var _oldTimestamp = data.timestamp;
				var isSelfClass = '';
				if(data.fromPeerId == self.clinetId){
					data.fromPeerId = self.clinetId;
					data.avat = self.clinetAvat;
					isSelfClass = 'msg-item_me';
				}else{
					data.avat = self.fromAvat;
					isSelfClass = 'msg-item_other';
				}

				data.timestamp = self.formatTime(data.timestamp);


				if(data.msg.type == 'image'){

					if(!data.msg.attr){
						data.msg.attr = {
							smallImg:self.returnSmallImg(data.msg.url,self.smallWidth,self.smallHeight)
						};
					}
					_html = template('J_tempMsgItem',data);
				}
				else if(data.msg.type == 'text'){
					//data.msg.text.replace(/\s/g, ' ');
					for(var _i = 0;_i<data.msg.text.length;_i++){
						data.msg.text[_i].msg = XQTOOL.filterWords.search(data.msg.text[_i].msg);
					}
					_html = template('J_tempMsgItem',data);
				}
				else{
					//图文
					_html = template('J_tempMsgItem',data);
				}

				_html = '<div class="message '+ isSelfClass +'" data-timestamp="'+ _oldTimestamp +'" >' + _html + '</div>';

				if(isBefore){
					self.J_imMsgBox.find('.im-msg-items').children().first().before(_html);
					var _eleLen = self.J_imMsgBox.find('.message').length;
					if(_eleLen){
						var _msgLastTime = self.J_imMsgBox.find('.message').eq(1).attr('data-timestamp');

						if(_msgLastTime && _msgLastTime != _oldTimestamp){
							var _diffTime = self.MsgTimeDiff(parseInt(_msgLastTime),parseInt(_oldTimestamp));
							if(_diffTime < 5){
								self.J_imMsgBox.find('.message').first().find('.msg-time').html('');
							}
						}
					}

				}
				else{
					self.J_imMsgBox.find('.im-msg-items').append(_html);
					var _eleLen = self.J_imMsgBox.find('.message').length;
					if(_eleLen){
						var _msgLastTime = self.J_imMsgBox.find('.message').eq(_eleLen-2).attr('data-timestamp');
						if(_msgLastTime && _msgLastTime != _oldTimestamp){
							var _diffTime = self.MsgTimeDiff(parseInt(_msgLastTime),parseInt(_oldTimestamp));
							if(_diffTime < 5){

								self.J_imMsgBox.find('.message').last().find('.msg-time').html('');
							}
						}
					}
				}

				self.sendIsable = true;

				self.J_imMsgBox.scrollTop(self.J_imMsgBox.find('.im-msg-items').height());
			}

		},
		returnSmallImg:function(url,width,height,quality,scaleToFit,fmt){
			var self = this;
			if(!url){
				throw "无效的url";
			}
			if(!width || !height || width <= 0 || height <= 0){
				throw "无效的宽或高";
			}
			quality = quality || 100;
			//scaleToFit = (scaleToFit == null)?true:scaleToFit;
			if(quality <= 0 || quality >100){
				throw '无效的品质值';
			}
			scaleToFit = scaleToFit || 2;
			fmt = fmt || 'png';
			//var mode = scaleToFit ? 2 : 1;
			var mode = scaleToFit;
			return url + '?imageView/' + mode + '/w/' + width + '/h/' + height
				+ '/q/' + quality + '/format/' + fmt;

		},
		encodeHTML:function(source){
			var self = this;
			return String(source).replace(/&/g,'&amp;')
			.replace(/</g,'&lt;')
			.replace(/>/g,'&gt;');

		},
		formatTime:function(time){
			if(!time){
				return '';
			}
			var date = new Date(time);
			var nowDate = new Date();
			var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() +1) : date.getMonth() + 1;
			var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
			var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
			var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
			var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
			// return date.getFullYear() + '-' + month + '-' + currentDate + ' ' + hh + ':' + mm + ':' + ss;
			// if(date.getFullYear() < nowDate.getFullYear()){
			//     return date.getFullYear() + '-' + month + '-' + currentDate + ' ' + hh + ':' + mm + ':' + ss;
			// }else{
			//     return  month + '月' + currentDate + '日 ' + hh + ':' + mm;
			// }

			if(date.getFullYear() == nowDate.getFullYear() && (date.getMonth() + 1) == (nowDate.getMonth() + 1)  && date.getDate() == nowDate.getDate()){
				return hh + ':' + mm;
			}else{
				return date.getFullYear() + '/' + month + '/' + currentDate + ' ' + hh + ':' + mm;
			}

		},
		isLoadImg:function(url,callback){
			var self = this;
			//图片是否加载完成
			var img = new Image();
			img.src = url;
			if(img.complete){
				callback.call(img);
				return ;
			}
			img.onload = function(){
				callback.call(img);
			}
		},
		sendMsgData:function(data){
			var self = this;
			//发送消息
			if(self.firstFlag){
				alert('服务器已经断开，请重新登录连接服务器！');
				return false;
			}



			if(self.clinetId == self.J_imBox.find(".J_userItem[class*=active]").attr('data-nickid')){
				alert('不能自摸，请自重！');
				return false;
			}

			var _roomId = self.J_imBox.find(".J_userItem[class*=active]").attr('data-roomid');

			if(!_roomId){
				//没有_room
				var _userId = self.J_imBox.find(".J_userItem[class*=active]").attr('data-nickid') || XIANGQU.productUserId;

				if(self.msgType == 'text') {
					var _str = self.J_imBox.find('.J_imInput').val();
					if (!_str || !String(_str).replace(/^\s+/, '').replace(/\s+$/, '')) {
						alert('发送内容不能为空，请重新输入！');
						self.J_imBox.find('.J_imInput').val('').focus();
						return false;
					}
				}
				self.realtimeObject.room({
					members:[self.clinetId,_userId],
					unique:true
				},function(rs){

					self.room = rs;
					self.J_imBox.find(".J_userItem[class*=active]").attr('data-roomid',self.room.id);

					if(self.msgType == 'textImg'){
						self.sendMessage(data);
					}else{
						self.sendMessage();
					}

				});



			}
			else{
				//有room时
				self.sendMessage(data);
			}




		},
		sendMessage:function(data){
			var self = this;
			var _data =  {};//发送的数据
			var _oldData = {};//发送成功后，前端自己拼装的数据

			if(!self.sendIsable){
				self.sendIsable = true;
				return false;
			}

			self.sendIsable = false;

			if(self.msgType == 'text'){
				var _str = self.J_imBox.find('.J_imInput').val();
				if(!_str || !String(_str).replace(/^\s+/,'').replace(/\s+$/,'')){
					alert('发送内容不能为空，请重新输入！!!');
					self.J_imBox.find('.J_imInput').val('').focus();
					return false;
				}
				_data = {
					text:_str,
				};
				self.room.send(_data,{
					type:self.msgType
				},function(rs){

					_oldData = {
						timestamp:rs.t,
						fromPeerId:self.clinetId,
						msg:{
							attr:undefined,
							text:_data.text,
							type:self.msgType,
						}
					};
					self.J_imBox.find('.J_imInput').val('').focus();
					_oldData.msg.text = self.regexpURL(_data.text);
					_oldData.msg.type = self.msgType;
					self.msgType = 'text';
					self.showHistoryLog(_oldData);
					self.J_imMsgBox.scrollTop(self.J_imMsgBox.find('.im-msg-items').height());
				});





			}
			else if(self.msgType == 'image'){
				var fileData = self.J_imBox.find('.J_imPicUploadBox .J_picUpload').data('data');
				var image = new Image(),
					originalWidth,
					originalHeight;
				image.onload = function(){
					originalWidth = this.width;
					originalHeight = this.height;
					_data = {
						attr:{
							id:fileData.id,
							smallImg: self.returnSmallImg(fileData._url,self.smallWidth,self.smallHeight)
						},
						metaData:{
							format:fileData._metaData.mime_type,
							size:fileData.size,
							width:originalWidth,
							height:originalHeight
						},
						type:self.msgType,
						url:fileData._url,
						text:fileData._name
					};
					self.room.send(_data,{
						type:self.msgType
					},function(rs){
						_oldData = {
							timestamp:rs.t,
							fromPeerId:self.clinetId,
							msg:_data
						};
						self.J_imBox.find('.J_imInput').val('').focus();
						self.J_imBox.find('.J_imPicUploadBox').hide();
						self.J_imBox.find('.J_picLoading').show();
						self.J_imBox.find('.J_picUpload').hide();
						self.J_imBox.find('#J_imPicFile').val("");
						self.msgType = 'text';

						self.showHistoryLog(_oldData);

						self.J_imMsgBox.scrollTop(self.J_imMsgBox.find('.im-msg-items').height());

					});

				}
				image.src = fileData._url;
			}
			else{
				_data = data;
				self.room.send(_data,function(rs){
					_oldData = {
						timestamp:rs.t,
						fromPeerId:self.clinetId,
						msg:_data
					};

					self.J_imMsgBox.find('.J_imdetailInfoBox').remove();
					self.msgType = 'text';

					self.showHistoryLog(_oldData);

					self.J_imMsgBox.scrollTop(self.J_imMsgBox.find('.im-msg-items').height());
				});
			}
		},
		regexpURL:function(_str){
			var self = this;
			if(!_str){
				return false;
			}
			if(typeof _str == 'string' ){
				var new_str = _str.replace(/&amp;/g,'&');
				new_str = new_str.replace(/((xiangqu|http){1}:\/\/(\w+\.){2,}(\w|%|&)+(\/(\w|%|&)+)*(\.html)?(\?\w+=(\w|%|\.)+)?((&){1}\w+=(\w|\.|%)+)*)/img, "%%xiangqu%%$1%%xiangqu%%");


				//console.log(new_str);
				return self.splitUrl(new_str,'%%xiangqu%%');
			}
			else{
				return _str;
			}


		},
		splitUrl:function(str,split_src){
			if(!str){
				return false;
			}

			var data = {};
			var _urlArray = str.split(split_src);
			for(var _i = 0;_i <_urlArray.length;_i+=2){
				data[_i] = {
					msg:_urlArray[_i],
					type:'text'
				};
			}
			for(var _i = 1;_i <_urlArray.length;_i+=2){
				data[_i] = {
					msg:_urlArray[_i],
					type:'link'
				};
			}
			var dataArray =[];
			for(var _i = 0;_i<_urlArray.length;_i++){
				dataArray[_i] = data[_i];
			}
			return dataArray;

		}

	};

	$(function(){
		PCIM.init();
	});

	window.PCIM = PCIM || {};
})(jQuery);