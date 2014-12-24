/**
 * 订餐控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('LunchCtrl', function($scope,$rootScope,$log,IndexedDB,LunchService,SettingService){
		var vm = $scope.vm = {};
		vm.LunchList = [];
		vm.currentPage = 0;
		var CaptchaModal = $('#captchaModal');
		//参数初始化
		$rootScope.getConfig(['LUNCH_LAST_TIMESTAMP','HYSDMS_ACCOUNT']).then(function (items) {
			vm.lastTimestamp = items['LUNCH_LAST_TIMESTAMP'];
			vm.Account = items['HYSDMS_ACCOUNT'] || {};
		});
		/**
		 * 初始化
		 */
		vm.fnInit = function(){
			//工具提示初始化
			$('[data-toggle="tooltip"]').tooltip();
			vm.fnGetLunchList();
			vm.fnLoadData(1);
		};

		/**
		 * 获取订餐列表
		 */
		vm.fnGetLunchList = function(){
			LunchService.query().then(function (lunchList) {
				vm.LunchList = lunchList;
				vm.maxPage = Math.floor(lunchList.length / 10);
				console.log( vm.currentPage == vm.maxPage);
			});
		};

		/**
		 * 向下翻页
		 */
		vm.nextPage = function () {
			vm.currentPage++;
		};

		/**
		 * 向上翻页
		 */
		vm.prevPage = function () {
			vm.currentPage--;
		};

		/**
		 * 打开验证码弹窗
		 */
		vm.fnOpen = function(text){
			if(vm.Account.username && vm.Account.password){
				vm.oper = text;// ordering | import
				CaptchaModal.modal('show');
			}else{
				$rootScope.notify('请先登陆');
			}
		};

		/**
		 * 登录前置方法
		 * @param captcha
		 * @param event
		 */
		vm.fnBeforeLogin = function (captcha, event) {
			if(captcha){
				var formData = angular.copy(vm.Account);
				formData.jcaptcha = captcha;
				$(event.target).button('loading');
				SettingService.hysdmsLogin(formData).then(function(){
					$(event.target).button('reset');
					CaptchaModal.modal('hide');
					switch (vm.oper){
						case 'ordering':
							vm.fnOrdering();
							break;
						case 'import':
							vm.fnLoadData(10);
							break;
					}
				},function(err){
					$(event.target).button('reset');
					$rootScope.notify(err);
				});
			}else{
				$rootScope.notify('请输入验证码');
			}
		};

		/**
		 * 订餐
		 */
		vm.fnOrdering = function(){
			var lastOrderTime = moment().hour(10).minute(30).second(0);
			var now = moment();
			//判断是否超过订餐时间10:30
			if(now.isAfter(lastOrderTime)){
				$rootScope.notify('已经超过订午饭时间！');
				return;
			}
			//查询今日是否订餐
			LunchService.load(1).then(function (pageInfo) {
				console.log('最后一次订餐记录', pageInfo);
				if(pageInfo && pageInfo.records && pageInfo.records[0]){
					var lastOrder = pageInfo.records[0].orderDate;
					if(lastOrder === now.format('YYYY-MM-DD')){
						$rootScope.notify('今天你已订餐!');
						return;
					}
					$rootScope.notify('正在订餐，请稍候……','info');
					LunchService.order(now.format('YYYY-MM-DD')).then(function(){
						//订餐成功
						$rootScope.notify('订餐成功!', 'success');
					},$rootScope.notify);
				}
			}, function (error) {
				$log.log('错误提示',error);
				vm.fnOpen('ordering');
			});
		};

		/**
		 * 导入数据
		 * @param size
		 */
		vm.fnLoadData = function(size){
			LunchService.load(size).then(function(pageInfo) {
				var totalRecords = pageInfo['totalRecords'];
				var records = pageInfo['records'];
				LunchService.save(records).then(function(res){
					vm.fnGetLunchList();
					$rootScope.setConfig('LUNCH_LAST_TIMESTAMP', Date.now()).then(function(data){
						vm.lastTimestamp = data['LUNCH_LAST_TIMESTAMP'];
					});
					var currentRecords = vm.LunchList.length + res.count;
					if (currentRecords < totalRecords) {
						//导入剩余记录
						var msg = Messenger().post({
							message: '当前已缓存'+currentRecords+'条记录,还有'+(totalRecords-currentRecords)+'记录未导入,是否全部导入?',
							id: 'hysdms',
							type: 'error',
							actions: {
								sure: {
									label: '确定',
									action: function() {
										vm.fnLoadData(totalRecords);
										msg.update({
											message: '正在导入，请稍候...',
											type: 'info',
											id: 'qnsofter',
											hideAfter: 10,
											actions: false
										});
									}
								},
								cancel: {
									label: '取消',
									action: function(){
										return msg.hide();
									}
								}
							}
						});
					}else{
						$rootScope.notify('导入成功！','success');
					}
				},$rootScope.notify);
			}, function (error) {
				$log.log('错误提示',error);
				vm.fnOpen('import');
			});
		};
	})
	.filter('offset', function () {
		return function (input, start) {
			start = parseInt(start, 10);
			return input.slice(start);
		};
	});

