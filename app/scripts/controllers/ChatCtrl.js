/**
 * 首页控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('ChatCtrl', function($scope,$rootScope,$log,$firebase,FIREBASE_DOMAIN){
		$('#noticeModal').modal('show');
		var vm = $scope.vm = {};
		vm.message = '';
		$rootScope.getConfig(['HYSDMS_ACCOUNT','ATTENDANCE_USER']).then(function (items) {
			if(items['HYSDMS_ACCOUNT']){
				vm.userId = items['HYSDMS_ACCOUNT'].username;
			}
			if(items['ATTENDANCE_USER']){
				vm.userId = items['ATTENDANCE_USER'].name || vm.userId;
			}
		})
		//最小消息长度
		var minlength = 3;
		vm.chats = $firebase(new Firebase('https://' + FIREBASE_DOMAIN + '.firebaseio.com/chats').endAt().limit(50));
		$rootScope.notify('数据加载中,请稍候...','info');
		$rootScope.loading = true;
		vm.chats.$on('loaded',function (res) {
			$rootScope.loading = false;
			$rootScope.notify('数据加载完成!','success');
			// $log.debug('加载完毕:',res);
			window.scrollTo(0,99999);
		});
		vm.chats.$on('child_added',function (res) {
			// $log.debug('添加child:',res);
			window.scrollTo(0,99999);
		});
		vm.fnBeforeSend = function (event) {
			if(event.keyCode == 13){
				vm.fnSendMessage();
			}
		}
		vm.fnSendMessage = function (target) {
			if(vm.message.length < minlength){
				$rootScope.notify('发言长度过短!再说些内容吧');
				return;
			}
			if($rootScope.chatLastTimestamp && (Date.now() - $rootScope.chatLastTimestamp) < 9594){
				$rootScope.notify('发言间隔过短!稍微休息一下吧');
				return;
			}
			var btn = target || '#sendBtn';
			$(btn).button('loading');
			var chat = {
				content: vm.message,
				timestamp: Date.now(),
				userId: vm.userId
			};
			vm.chats.$add(chat).then(function (ref) {
				$log.debug('返回值:',ref.name());
				$rootScope.notify('发送成功!','success');
				$(btn).button('reset');
				vm.message = '';
				$rootScope.chatLastTimestamp = Date.now();
			},function (error) {
				$log.debug('错误:',error);
				$rootScope.notify('发送失败!');
			});
		}
	})
	.filter('humanizeDate', function () {
		var filter = function(timestamp){
			return moment.duration(timestamp-Date.now()).humanize(true);
		};
		return filter;
	});
